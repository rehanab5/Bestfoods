import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../models.dart';
import '../state/app_state.dart';
import '../widgets/common.dart';
import 'checkout_screen.dart';

Future<void> showCartSheet(BuildContext context) {
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    showDragHandle: true,
    builder: (sheetContext) => DraggableScrollableSheet(
      expand: false,
      initialChildSize: 0.85,
      maxChildSize: 0.95,
      minChildSize: 0.4,
      builder: (_, controller) => _CartBody(
        controller: controller,
        onCheckout: () {
          Navigator.of(sheetContext).pop();
          Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const CheckoutScreen()));
        },
      ),
    ),
  );
}

class _CartBody extends StatelessWidget {
  const _CartBody({required this.controller, required this.onCheckout});
  final ScrollController controller;
  final VoidCallback onCheckout;

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartState>();
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;

    if (cart.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.shopping_bag_outlined, size: 56, color: cs.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(lang.t('cart.empty'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 4),
            Text(lang.t('cart.emptyDesc'),
                style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 16),
            FilledButton(
                onPressed: () => Navigator.of(context).pop(),
                child: Text(lang.t('cart.viewMenu'))),
          ]),
        ),
      );
    }

    final remaining = Restaurant.freeDeliveryOver - cart.subtotal;
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
        child: Row(children: [
          Text(lang.t('cart.title'),
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
          const SizedBox(width: 8),
          Text(lang.t('cart.items', [cart.totalItems]),
              style: TextStyle(color: cs.onSurfaceVariant)),
        ]),
      ),
      Expanded(
        child: ListView.separated(
          controller: controller,
          padding: const EdgeInsets.symmetric(horizontal: 20),
          itemCount: cart.items.length,
          separatorBuilder: (_, __) => const Divider(height: 24),
          itemBuilder: (_, i) => _CartRow(line: cart.items[i]),
        ),
      ),
      Container(
        padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
        decoration: BoxDecoration(border: Border(top: BorderSide(color: cs.outline))),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          if (remaining > 0)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(lang.t('cart.freeDeliveryMsg', [formatPrice(remaining)]),
                  style: TextStyle(color: cs.tertiary, fontWeight: FontWeight.w600)),
            ),
          _TotalRow(lang.t('cart.subtotal'), formatPrice(cart.subtotal)),
          _TotalRow(lang.t('cart.delivery'),
              cart.deliveryFee == 0 ? lang.t('cart.free') : formatPrice(cart.deliveryFee)),
          const SizedBox(height: 4),
          _TotalRow(lang.t('cart.total'), formatPrice(cart.total), bold: true),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
                onPressed: onCheckout, child: Text(lang.t('cart.checkout'))),
          ),
          const SizedBox(height: 6),
          Text(lang.t('cart.taxNote', [Restaurant.deliveryMin]),
              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
        ]),
      ),
    ]);
  }
}

class _TotalRow extends StatelessWidget {
  const _TotalRow(this.label, this.value, {this.bold = false});
  final String label, value;
  final bool bold;

  @override
  Widget build(BuildContext context) {
    final style = TextStyle(
        fontSize: bold ? 18 : 14,
        fontWeight: bold ? FontWeight.w800 : FontWeight.w500);
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [Text(label, style: style), Text(value, style: style)]),
    );
  }
}

class _CartRow extends StatelessWidget {
  const _CartRow({required this.line});
  final CartItem line;

  @override
  Widget build(BuildContext context) {
    final cart = context.read<CartState>();
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    return Row(children: [
      ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: SizedBox(width: 56, height: 56, child: NetImage(line.item.image)),
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(line.item.localizedName(lang.lang),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w700)),
          Text(formatPrice(line.item.price),
              style: TextStyle(color: cs.primary, fontWeight: FontWeight.w800)),
        ]),
      ),
      IconButton(
        tooltip: lang.t('cart.minus'),
        icon: const Icon(Icons.remove_circle_outline),
        onPressed: () => cart.setQuantity(line.item.id, line.quantity - 1),
      ),
      Text('${line.quantity}', style: const TextStyle(fontWeight: FontWeight.w700)),
      IconButton(
        tooltip: lang.t('item.addOne'),
        icon: const Icon(Icons.add_circle),
        color: cs.primary,
        onPressed: () => cart.add(line.item),
      ),
      IconButton(
        tooltip: lang.t('cart.remove'),
        icon: const Icon(Icons.delete_outline),
        onPressed: () => cart.remove(line.item.id),
      ),
    ]);
  }
}
