import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'checkout_screen.dart';
import 'order_tracking_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  List<Order> _orders = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch() async {
    try {
      final o = await Api.fetchMyOrders();
      if (mounted) setState(() => _orders = o);
    } catch (_) {
      if (mounted) setState(() => _orders = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _reorder(Order order) {
    final cart = context.read<CartState>();
    final menu = context.read<MenuState>();
    final lang = context.read<LangState>();
    cart.clear();
    for (final line in order.items) {
      final m = [...menu.items, ...menu.deals]
          .where((x) => x.name == line.name)
          .firstOrNull;
      if (m != null) cart.add(m, line.quantity);
    }
    toast(context, lang.t('orders.reorderToast'));
    Navigator.of(context)
        .push(MaterialPageRoute(builder: (_) => const CheckoutScreen()));
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;

    if (_loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: _fetch,
      child: ListView(padding: const EdgeInsets.all(16), children: [
        Text(lang.t('orders.title'), style: AppTheme.display(context, size: 32)),
        const SizedBox(height: 16),
        if (_orders.isEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 60),
            child: Column(children: [
              Icon(Icons.receipt_long, size: 56, color: cs.onSurfaceVariant),
              const SizedBox(height: 12),
              Text(lang.t('orders.empty'),
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              const SizedBox(height: 4),
              Text(lang.t('orders.emptyDesc'),
                  textAlign: TextAlign.center,
                  style: TextStyle(color: cs.onSurfaceVariant)),
            ]),
          ),
        for (final o in _orders)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(children: [
                  Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        if (o.createdAt != null)
                          Text(MaterialLocalizations.of(context).formatShortDate(o.createdAt!),
                              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                        Text(o.orderNumber,
                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16)),
                        Text(lang.t('orders.items', [o.itemCount]),
                            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                      ]),
                    ),
                    Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                      StatusChip(o.status),
                      const SizedBox(height: 4),
                      Text(formatPrice(o.total),
                          style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
                    ]),
                  ]),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                            builder: (_) => OrderTrackingScreen(orderId: o.id))),
                        child: Text(lang.t('orders.track')),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: FilledButton(
                        onPressed: () => _reorder(o),
                        child: Text(lang.t('orders.reorder')),
                      ),
                    ),
                  ]),
                ]),
              ),
            ),
          ),
      ]),
    );
  }
}

class StatusChip extends StatelessWidget {
  const StatusChip(this.status, {super.key});
  final String status;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    final color = status == 'cancelled' ? cs.error : cs.primary;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(20)),
      child: Text(lang.t('status.$status'),
          style: TextStyle(color: cs.onPrimary, fontSize: 11, fontWeight: FontWeight.w700)),
    );
  }
}
