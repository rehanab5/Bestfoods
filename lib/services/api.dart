import 'dart:math' as math;

import 'package:geolocator/geolocator.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../models.dart';

class ApiException implements Exception {
  final String message;
  ApiException(this.message);
  @override
  String toString() => message;
}

class OrderResult {
  final String orderId;
  final String orderNumber;
  final String? clientSecret;
  OrderResult(this.orderId, this.orderNumber, this.clientSecret);
}

class Api {
  static SupabaseClient get _c => Supabase.instance.client;

  static String? get userId => _c.auth.currentUser?.id;

  // Each install gets an anonymous session so orders can be tied to the device
  // without exposing customer data publicly.
  static Future<void> ensureSession() async {
    if (_c.auth.currentSession == null) {
      await _c.auth.signInAnonymously();
    }
  }

  static Future<List<MenuItem>> fetchMenuItems() async {
    final rows = await _c.from('menu_items').select().order('sort_order');
    return rows.map(MenuItem.fromJson).toList();
  }

  static Future<List<Location>> fetchLocations() async {
    final rows = await _c.from('locations').select().order('sort_order');
    return rows.map(Location.fromJson).toList();
  }

  static Future<OrderResult> createOrder(Map<String, dynamic> payload) async {
    try {
      final res = await _c.functions.invoke('create-order', body: payload);
      final d = Map<String, dynamic>.from(res.data as Map);
      return OrderResult(
        d['order_id'] as String,
        d['order_number'] as String,
        d['client_secret'] as String?,
      );
    } on FunctionException catch (e) {
      final details = e.details;
      throw ApiException(
        details is Map && details['error'] != null
            ? details['error'].toString()
            : 'Error',
      );
    }
  }

  static Future<List<Order>> fetchMyOrders() async {
    final uid = userId;
    if (uid == null) return [];
    final rows = await _c
        .from('orders')
        .select()
        .eq('user_id', uid)
        .order('created_at', ascending: false);
    return rows.map(Order.fromJson).toList();
  }

  static Future<Order?> fetchOrder(String id) async {
    final row = await _c.from('orders').select().eq('id', id).maybeSingle();
    return row == null ? null : Order.fromJson(row);
  }

  static Future<void> deleteAccount() async {
    try {
      await _c.functions.invoke('delete-account');
    } on FunctionException catch (e) {
      final details = e.details;
      throw ApiException(
        details is Map && details['error'] != null
            ? details['error'].toString()
            : 'Error',
      );
    }
    await _c.auth.signOut();
    await _c.auth.signInAnonymously();
  }

  // ---- Admin ----

  static Future<bool> isAdmin() async {
    final uid = userId;
    if (uid == null) return false;
    final row =
        await _c.from('profiles').select('role').eq('id', uid).maybeSingle();
    return row?['role'] == 'admin';
  }

  static Future<void> adminSignIn(String email, String password) async {
    try {
      await _c.auth.signInWithPassword(email: email, password: password);
    } on AuthException catch (e) {
      throw ApiException(e.message);
    }
  }

  static Future<void> adminSignOut() async {
    await _c.auth.signOut();
    await _c.auth.signInAnonymously();
  }

  static Future<void> saveRow(
      String table, String? id, Map<String, dynamic> values) async {
    if (id == null) {
      await _c.from(table).insert(values);
    } else {
      await _c.from(table).update(values).eq('id', id);
    }
  }

  static Future<void> deleteRow(String table, String id) async {
    await _c.from(table).delete().eq('id', id);
  }

  static Future<List<Review>> fetchReviews() async {
    final rows =
        await _c.from('reviews').select().order('created_at', ascending: false);
    return rows.map(Review.fromJson).toList();
  }

  static Future<void> setReviewApproved(String id, bool approved) async {
    await _c.from('reviews').update({'approved': approved}).eq('id', id);
  }
}

// ---- Geolocation helpers ----

Future<({double lat, double lng})> getUserLocation() async {
  var perm = await Geolocator.checkPermission();
  if (perm == LocationPermission.denied) {
    perm = await Geolocator.requestPermission();
  }
  if (perm == LocationPermission.denied ||
      perm == LocationPermission.deniedForever) {
    throw Exception('denied');
  }
  final pos = await Geolocator.getCurrentPosition(
    locationSettings: const LocationSettings(
      accuracy: LocationAccuracy.high,
      timeLimit: Duration(seconds: 10),
    ),
  );
  return (lat: pos.latitude, lng: pos.longitude);
}

double haversineDistance(double lat1, double lng1, double lat2, double lng2) {
  const r = 6371.0;
  double rad(double d) => d * math.pi / 180;
  final dLat = rad(lat2 - lat1);
  final dLng = rad(lng2 - lng1);
  final a = math.pow(math.sin(dLat / 2), 2) +
      math.cos(rad(lat1)) *
          math.cos(rad(lat2)) *
          math.pow(math.sin(dLng / 2), 2);
  return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a));
}

// Straight-line distance → estimated driving minutes (city avg ~25 km/h).
int estimateDriveTime(double km) => math.max(1, (km / 25 * 60).round());

class Distance {
  final double km;
  final int minutes;
  Distance(this.km, this.minutes);
}

/// Returns distances keyed by location id plus the id of the nearest one.
Future<({Map<String, Distance> distances, String? nearestId})> locateNearest(
    List<Location> locations) async {
  final pos = await getUserLocation();
  final map = <String, Distance>{};
  String? nearest;
  double best = double.infinity;
  for (final l in locations) {
    if (l.lat == null || l.lng == null) continue;
    final km = haversineDistance(pos.lat, pos.lng, l.lat!, l.lng!);
    map[l.id] = Distance(km, estimateDriveTime(km));
    if (km < best) {
      best = km;
      nearest = l.id;
    }
  }
  return (distances: map, nearestId: nearest);
}
