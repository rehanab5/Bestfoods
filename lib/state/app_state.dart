import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config.dart';
import '../l10n/strings.dart';
import '../models.dart';
import '../services/api.dart';

class LangState extends ChangeNotifier {
  LangState(this._prefs) : lang = _prefs.getString('bf_lang') ?? 'es';
  final SharedPreferences _prefs;
  String lang;

  void toggle() => setLang(lang == 'es' ? 'en' : 'es');

  void setLang(String l) {
    lang = l;
    _prefs.setString('bf_lang', l);
    notifyListeners();
  }

  /// Looks up [key]; `{0}`, `{1}` are replaced by [args]. When the first
  /// argument is 1 and a `key#one` entry exists, the singular form is used.
  String t(String key, [List<Object> args = const []]) {
    final dict = strings[lang] ?? strings['es']!;
    var s = dict[key];
    if (args.isNotEmpty && args.first == 1) s = dict['$key#one'] ?? s;
    s ??= key;
    for (var i = 0; i < args.length; i++) {
      s = s!.replaceAll('{$i}', '${args[i]}');
    }
    return s!;
  }
}

class CartState extends ChangeNotifier {
  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);
  int get totalItems => _items.fold(0, (s, i) => s + i.quantity);
  double get subtotal =>
      _items.fold(0.0, (s, i) => s + i.item.price * i.quantity);
  double get deliveryFee =>
      subtotal == 0 || subtotal >= Restaurant.freeDeliveryOver
          ? 0
          : Restaurant.deliveryFee;
  double get total => subtotal + deliveryFee;

  int quantityOf(String id) {
    for (final i in _items) {
      if (i.item.id == id) return i.quantity;
    }
    return 0;
  }

  void add(MenuItem item, [int qty = 1]) {
    final idx = _items.indexWhere((i) => i.item.id == item.id);
    if (idx >= 0) {
      _items[idx].quantity += qty;
    } else {
      _items.add(CartItem(item, qty));
    }
    notifyListeners();
  }

  void setQuantity(String id, int qty) {
    if (qty <= 0) {
      _items.removeWhere((i) => i.item.id == id);
    } else {
      final idx = _items.indexWhere((i) => i.item.id == id);
      if (idx >= 0) _items[idx].quantity = qty;
    }
    notifyListeners();
  }

  void remove(String id) => setQuantity(id, 0);

  void clear() {
    _items.clear();
    notifyListeners();
  }
}

class MenuState extends ChangeNotifier {
  List<MenuItem> items = [];
  List<MenuItem> deals = [];
  List<Location> locations = [];
  bool loading = true;
  String? error;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      final all = await Api.fetchMenuItems();
      items = all.where((m) => !m.isDeal).toList();
      deals = all.where((m) => m.isDeal).toList();
      locations = await Api.fetchLocations();
    } catch (e) {
      error = e.toString();
    }
    loading = false;
    notifyListeners();
  }
}

class ProfileStore {
  ProfileStore(this._prefs);
  final SharedPreferences _prefs;
  static const _key = 'bf_profile';

  Profile load() {
    try {
      return Profile.fromJson(
          jsonDecode(_prefs.getString(_key) ?? '{}') as Map<String, dynamic>);
    } catch (_) {
      return Profile();
    }
  }

  Future<void> save(Profile p) => _prefs.setString(_key, jsonEncode(p.toJson()));
  Future<void> clear() => _prefs.remove(_key);
}
