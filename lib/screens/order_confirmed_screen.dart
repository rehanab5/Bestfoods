import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'order_tracking_screen.dart';

class OrderConfirmedScreen extends StatelessWidget {
  const OrderConfirmedScreen(
      {super.key, required this.orderId, required this.orderNumber});
  final String orderId;
  final String orderNumber;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(24), children: [
          const SizedBox(height: 24),
          Icon(Icons.check_circle, size: 80, color: cs.tertiary),
          const SizedBox(height: 12),
          Text(lang.t('confirmed.title'),
              textAlign: TextAlign.center, style: AppTheme.display(context, size: 34)),
          const SizedBox(height: 6),
          Text(lang.t('confirmed.thanks'),
              textAlign: TextAlign.center,
              style: TextStyle(color: cs.onSurfaceVariant)),
          const SizedBox(height: 24),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(children: [
                _row(context, lang.t('confirmed.orderNumber'), orderNumber, bold: true),
                const Divider(height: 24),
                _row(context, lang.t('confirmed.estimatedTime'), lang.t('confirmed.mins')),
                const Divider(height: 24),
                _row(context, lang.t('confirmed.preparingAt'),
                    lang.t('confirmed.preparingAtVal')),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          Card(
            child: ListTile(
              leading: Icon(Icons.phone, color: cs.primary),
              title: Text(lang.t('confirmed.help')),
              subtitle: Text(lang.t('confirmed.helpDesc', [Restaurant.phone])),
              onTap: () => callPhone(Restaurant.phone),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: () => Navigator.of(context).push(MaterialPageRoute(
                builder: (_) => OrderTrackingScreen(orderId: orderId))),
            child: Text(lang.t('confirmed.trackOrder')),
          ),
          const SizedBox(height: 10),
          OutlinedButton(
            onPressed: () => Navigator.of(context).popUntil((r) => r.isFirst),
            child: Text(lang.t('confirmed.orderAgain')),
          ),
        ]),
      ),
    );
  }

  Widget _row(BuildContext context, String label, String value, {bool bold = false}) {
    final cs = Theme.of(context).colorScheme;
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(label, style: TextStyle(color: cs.onSurfaceVariant)),
      Text(value,
          style: TextStyle(
              fontWeight: FontWeight.w800, fontSize: bold ? 18 : 14, letterSpacing: bold ? 1 : 0)),
    ]);
  }
}
