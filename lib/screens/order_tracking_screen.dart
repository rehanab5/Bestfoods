import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import 'orders_screen.dart';

const _steps = ['received', 'preparing', 'ready', 'delivered'];

class OrderTrackingScreen extends StatefulWidget {
  const OrderTrackingScreen({super.key, required this.orderId});
  final String orderId;

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen>
    with WidgetsBindingObserver {
  Order? _order;
  bool _loading = true;
  bool _refreshing = false;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetch();
    _startTimer();
  }

  void _startTimer() {
    _timer ??= Timer.periodic(const Duration(seconds: 5), (_) => _fetch(silent: true));
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _startTimer();
    } else {
      _timer?.cancel();
      _timer = null;
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _fetch({bool silent = false}) async {
    if (silent) {
      setState(() => _refreshing = true);
    }
    try {
      final o = await Api.fetchOrder(widget.orderId);
      if (mounted) setState(() => _order = o);
    } catch (_) {
      // Keep the last known order on transient network errors.
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
          _refreshing = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;

    if (_loading) {
      return Scaffold(
          appBar: AppBar(), body: const Center(child: CircularProgressIndicator()));
    }
    final order = _order;
    if (order == null) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Text(lang.t('track.notFound'),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        ),
      );
    }

    final stepIndex = _steps.indexOf(order.status);
    final cancelled = order.status == 'cancelled';

    return Scaffold(
      appBar: AppBar(
        title: Text(lang.t('track.title'), style: AppTheme.display(context, size: 22)),
        actions: [
          if (_refreshing)
            const Padding(
              padding: EdgeInsets.only(right: 16),
              child: SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2)),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => _fetch(silent: true),
        child: ListView(padding: const EdgeInsets.all(16), children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(lang.t('track.orderNumber'),
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                      Text(order.orderNumber,
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 20)),
                    ]),
                  ),
                  StatusChip(order.status),
                ]),
                if (order.createdAt != null) ...[
                  const SizedBox(height: 6),
                  Text('${lang.t('track.placed')}: ${order.createdAt}',
                      style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                ],
              ]),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                for (var i = 0; i < _steps.length; i++) ...[
                  Column(children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor: i <= stepIndex && !cancelled
                          ? cs.primary
                          : cs.surfaceContainerHighest,
                      child: Text('${i + 1}',
                          style: TextStyle(
                              fontWeight: FontWeight.w700,
                              color: i <= stepIndex && !cancelled
                                  ? cs.onPrimary
                                  : cs.onSurfaceVariant)),
                    ),
                    const SizedBox(height: 6),
                    SizedBox(
                      width: 60,
                      child: Text(lang.t('status.${_steps[i]}'),
                          textAlign: TextAlign.center,
                          style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: i <= stepIndex && !cancelled
                                  ? cs.primary
                                  : cs.onSurfaceVariant)),
                    ),
                  ]),
                  if (i < _steps.length - 1)
                    Expanded(
                      child: Container(
                        height: 4,
                        margin: const EdgeInsets.only(top: 16),
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(2),
                          color: i < stepIndex && !cancelled
                              ? cs.primary
                              : cs.surfaceContainerHighest,
                        ),
                      ),
                    ),
                ],
              ]),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(lang.t('track.items'),
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 8),
                for (final it in order.items)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 3),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Expanded(
                          child: Text('${it.quantity}× ${it.name}',
                              style: TextStyle(color: cs.onSurfaceVariant))),
                      Text(formatPrice(it.price * it.quantity)),
                    ]),
                  ),
                const Divider(height: 20),
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text(lang.t('track.total'),
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  Text(formatPrice(order.total),
                      style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                ]),
              ]),
            ),
          ),
          const SizedBox(height: 14),
          Card(
            child: ListTile(
              leading: Icon(Icons.place_outlined, color: cs.primary),
              title: Text(lang.t('track.location')),
              subtitle: Text(order.locationName ?? '—'),
            ),
          ),
          const SizedBox(height: 8),
          Card(
            child: ListTile(
              leading: Icon(Icons.credit_card, color: cs.primary),
              title: Text(lang.t('track.payment')),
              subtitle: Text(lang.t('pay.${order.paymentStatus}')),
            ),
          ),
        ]),
      ),
    );
  }
}
