import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class AboutScreen extends StatelessWidget {
  const AboutScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final menu = context.watch<MenuState>();
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('about.back'))),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Row(children: [
          const Logo(size: 48),
          const SizedBox(width: 12),
          Text('BEST FOODS', style: AppTheme.display(context, size: 24)),
        ]),
        const SizedBox(height: 20),
        Text(lang.t('about.title'), style: AppTheme.display(context, size: 32)),
        const SizedBox(height: 16),
        for (final p in [
          lang.t('about.p1'),
          lang.t('about.p2'),
          lang.t('about.p3'),
          lang.t('about.p4', [Restaurant.deliveryMin]),
          lang.t('about.p5', [Restaurant.hoursLunch, Restaurant.hoursDinner]),
        ])
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(p, style: const TextStyle(height: 1.55)),
          ),
        const SizedBox(height: 8),
        for (final loc in menu.locations)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(loc.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                const SizedBox(height: 4),
                InfoRow(Icons.place_outlined, loc.address),
                if (loc.phone != null && loc.phone!.isNotEmpty)
                  InfoRow(Icons.phone, loc.phone!, onTap: () => callPhone(loc.phone!)),
              ]),
            ),
          ),
        const SizedBox(height: 12),
        InfoRow(Icons.schedule, '${Restaurant.hoursLunch} · ${Restaurant.hoursDinner}'),
        InfoRow(Icons.delivery_dining, lang.t('about.delivery', [Restaurant.deliveryMin])),
        const SizedBox(height: 20),
        FilledButton(
          onPressed: () => Navigator.of(context).pop(),
          style: FilledButton.styleFrom(backgroundColor: cs.primary),
          child: Text(lang.t('about.viewMenu')),
        ),
      ]),
    );
  }
}
