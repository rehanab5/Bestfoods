import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../state/app_state.dart';
import 'common.dart';

class MenuItemCard extends StatelessWidget {
  const MenuItemCard({super.key, required this.item, this.deal = false});
  final MenuItem item;
  final bool deal;

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartState>();
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    final qty = cart.quantityOf(item.id);
    final name = item.localizedName(lang.lang);

    void add() {
      cart.add(item);
      toast(context,
          '$name ${lang.lang == 'en' ? 'added' : 'añadido'}');
    }

    return Card(
      clipBehavior: Clip.antiAlias,
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        AspectRatio(
          aspectRatio: 4 / 3,
          child: Stack(fit: StackFit.expand, children: [
            NetImage(item.image),
            if (deal && (item.badge?.isNotEmpty ?? false))
              Positioned(
                top: 8,
                left: 8,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                      color: cs.primary, borderRadius: BorderRadius.circular(20)),
                  child: Text(item.badge!,
                      style: TextStyle(
                          color: cs.onPrimary,
                          fontSize: 11,
                          fontWeight: FontWeight.w700)),
                ),
              ),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 10, 12, 10),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
            const SizedBox(height: 2),
            Text(item.localizedDescription(lang.lang),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(color: cs.onSurfaceVariant, fontSize: 12.5)),
            const SizedBox(height: 8),
            Row(children: [
              Expanded(
                child: Text(formatPrice(item.price),
                    style: TextStyle(
                        color: deal ? cs.tertiary : cs.primary,
                        fontWeight: FontWeight.w800,
                        fontSize: 18)),
              ),
              if (qty == 0)
                FilledButton.tonal(
                  style: FilledButton.styleFrom(
                      minimumSize: const Size(44, 40),
                      padding: const EdgeInsets.symmetric(horizontal: 14)),
                  onPressed: add,
                  child: Text(lang.t('item.add')),
                )
              else
                Row(mainAxisSize: MainAxisSize.min, children: [
                  IconButton(
                    tooltip: lang.t('item.reduce'),
                    visualDensity: VisualDensity.compact,
                    icon: const Icon(Icons.remove_circle_outline),
                    onPressed: () => cart.setQuantity(item.id, qty - 1),
                  ),
                  Text('$qty',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  IconButton(
                    tooltip: lang.t('item.addOne'),
                    visualDensity: VisualDensity.compact,
                    color: cs.primary,
                    icon: const Icon(Icons.add_circle),
                    onPressed: add,
                  ),
                ]),
            ]),
          ]),
        ),
      ]),
    );
  }
}
