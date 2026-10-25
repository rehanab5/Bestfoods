import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../config.dart';
import '../models.dart';
import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/menu_item_card.dart';
import 'about_screen.dart';
import 'contact_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String _category = 'all';
  final _menuKey = GlobalKey();

  void _scrollToMenu() => Scrollable.ensureVisible(_menuKey.currentContext!,
      duration: const Duration(milliseconds: 400), curve: Curves.easeInOut);

  @override
  Widget build(BuildContext context) {
    final menu = context.watch<MenuState>();
    final lang = context.watch<LangState>();

    if (menu.loading && menu.items.isEmpty && menu.deals.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (menu.error != null && menu.items.isEmpty && menu.deals.isEmpty) {
      return ErrorRetry(message: menu.error!, onRetry: menu.load);
    }

    final visible = _category == 'all'
        ? menu.items
        : menu.items.where((m) => m.category == _category).toList();

    return RefreshIndicator(
      onRefresh: menu.load,
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          _Hero(onOrder: _scrollToMenu),
          if (menu.deals.isNotEmpty) _Deals(deals: menu.deals),
          Container(key: _menuKey),
          _CategoryTabs(
            active: _category,
            onChanged: (c) => setState(() => _category = c),
          ),
          Padding(
            padding: const EdgeInsets.all(16),
            child: LayoutBuilder(builder: (context, c) {
              final cols = c.maxWidth >= 900 ? 4 : (c.maxWidth >= 600 ? 3 : 2);
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: cols,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  mainAxisExtent: 270,
                ),
                itemCount: visible.length,
                itemBuilder: (_, i) => MenuItemCard(item: visible[i]),
              );
            }),
          ),
          _LocationsSection(locations: menu.locations),
          _Footer(lang: lang),
        ],
      ),
    );
  }
}

class _Hero extends StatelessWidget {
  const _Hero({required this.onOrder});
  final VoidCallback onOrder;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: cs.secondary,
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 28),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Logo(size: 52),
          const SizedBox(width: 12),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text.rich(TextSpan(children: [
                const TextSpan(text: 'Best '),
                TextSpan(text: 'Foods', style: TextStyle(color: cs.primary)),
              ]), style: AppTheme.display(context, size: 34)),
              Text(lang.t('hero.tagline').toUpperCase(),
                  style: TextStyle(
                      color: cs.primary,
                      fontSize: 11,
                      letterSpacing: 1.6,
                      fontWeight: FontWeight.w800)),
            ]),
          ),
        ]),
        const SizedBox(height: 18),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: cs.surface,
            border: Border.all(color: cs.outline),
            borderRadius: BorderRadius.circular(30),
          ),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.delivery_dining, size: 18, color: cs.primary),
            const SizedBox(width: 6),
            Flexible(
              child: Text(lang.t('hero.deliveryFrom', [Restaurant.deliveryMin]),
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
            ),
          ]),
        ),
        const SizedBox(height: 14),
        Text(lang.t('hero.desc'),
            style: TextStyle(fontSize: 16, height: 1.5, color: cs.onSurfaceVariant)),
        const SizedBox(height: 18),
        Wrap(spacing: 10, runSpacing: 10, children: [
          FilledButton.icon(
            onPressed: onOrder,
            icon: const Icon(Icons.arrow_forward, size: 18),
            label: Text(lang.t('hero.order')),
            iconAlignment: IconAlignment.end,
          ),
          OutlinedButton(onPressed: onOrder, child: Text(lang.t('hero.menu'))),
        ]),
        const SizedBox(height: 16),
        InfoRow(Icons.schedule,
            lang.t('hero.hours', [Restaurant.hoursLunch, Restaurant.hoursDinner])),
        InfoRow(Icons.place_outlined, lang.t('hero.locations')),
        const SizedBox(height: 14),
        ClipRRect(
          borderRadius: BorderRadius.circular(24),
          child: AspectRatio(
              aspectRatio: 4 / 3, child: NetImage(Restaurant.heroImage)),
        ),
      ]),
    );
  }
}

class _Deals extends StatelessWidget {
  const _Deals({required this.deals});
  final List<MenuItem> deals;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    return Container(
      color: Theme.of(context).colorScheme.surface,
      padding: const EdgeInsets.symmetric(vertical: 24),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Text(lang.t('deals.title'), style: AppTheme.display(context, size: 28)),
        ),
        const SizedBox(height: 14),
        SizedBox(
          height: 270,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: deals.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (_, i) => SizedBox(
                width: 210, child: MenuItemCard(item: deals[i], deal: true)),
          ),
        ),
      ]),
    );
  }
}

class _CategoryTabs extends StatelessWidget {
  const _CategoryTabs({required this.active, required this.onChanged});
  final String active;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    return SizedBox(
      height: 60,
      child: ListView(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        children: [
          _chip(lang.t('menu.all'), '✨', 'all'),
          for (final c in categories)
            _chip(lang.lang == 'en' ? c.labelEn : c.label, c.emoji, c.id),
        ],
      ),
    );
  }

  Widget _chip(String label, String emoji, String id) => Padding(
        padding: const EdgeInsets.only(right: 6),
        child: ChoiceChip(
          label: Text('$emoji $label'),
          selected: active == id,
          showCheckmark: false,
          shape: const StadiumBorder(),
          onSelected: (_) => onChanged(id),
        ),
      );
}

class _LocationsSection extends StatefulWidget {
  const _LocationsSection({required this.locations});
  final List<Location> locations;

  @override
  State<_LocationsSection> createState() => _LocationsSectionState();
}

class _LocationsSectionState extends State<_LocationsSection> {
  Map<String, Distance> _distances = {};
  String? _nearestId;
  bool _locating = false;

  Future<void> _locate() async {
    final lang = context.read<LangState>();
    setState(() => _locating = true);
    try {
      final r = await locateNearest(widget.locations);
      if (!mounted) return;
      setState(() {
        _distances = r.distances;
        _nearestId = r.nearestId;
      });
      toast(context, lang.t('location.nearest'));
    } catch (_) {
      if (mounted) toast(context, lang.t('location.denied'), error: true);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    return Container(
      color: cs.surfaceContainerHighest,
      padding: const EdgeInsets.all(20),
      child: Column(children: [
        Text(lang.t('locations.findUs').toUpperCase(),
            style: TextStyle(
                color: cs.primary,
                fontSize: 11,
                letterSpacing: 2.4,
                fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(lang.t('locations.title'), style: AppTheme.display(context, size: 30)),
        const SizedBox(height: 8),
        Text(lang.t('locations.subtitle', [Restaurant.deliveryMin]),
            textAlign: TextAlign.center,
            style: TextStyle(color: cs.onSurfaceVariant)),
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: _locating || widget.locations.isEmpty ? null : _locate,
          icon: _locating
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2))
              : const Icon(Icons.navigation, size: 18),
          label: Text(_locating
              ? lang.t('location.detecting')
              : lang.t('location.useMyLocation')),
        ),
        const SizedBox(height: 16),
        for (var i = 0; i < widget.locations.length; i++)
          _LocationCard(
            index: i,
            loc: widget.locations[i],
            distance: _distances[widget.locations[i].id],
            nearest: _nearestId == widget.locations[i].id,
          ),
        const SizedBox(height: 8),
        _tile(context, Icons.phone, lang.t('locations.phone'), Restaurant.phone,
            () => callPhone(Restaurant.phone)),
        _tile(context, Icons.schedule, lang.t('locations.hours'),
            '${Restaurant.hoursLunch} · ${Restaurant.hoursDinner}', null),
        _tile(context, Icons.delivery_dining, lang.t('locations.delivery'),
            lang.t('locations.deliveryVal', [Restaurant.deliveryMin]), null),
      ]),
    );
  }

  Widget _tile(BuildContext context, IconData icon, String title, String value,
      VoidCallback? onTap) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(top: 8),
      child: Material(
        color: cs.secondary.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(12),
        child: InkWell(
          borderRadius: BorderRadius.circular(12),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(14),
            child: Row(children: [
              Icon(icon, color: cs.primary),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(title,
                      style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                  Text(value, style: const TextStyle(fontWeight: FontWeight.w600)),
                ]),
              ),
            ]),
          ),
        ),
      ),
    );
  }
}

class _LocationCard extends StatelessWidget {
  const _LocationCard(
      {required this.index,
      required this.loc,
      required this.distance,
      required this.nearest});
  final int index;
  final Location loc;
  final Distance? distance;
  final bool nearest;

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: cs.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: nearest ? cs.primary : cs.outline),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            CircleAvatar(
              radius: 14,
              backgroundColor: cs.primary.withValues(alpha: 0.15),
              child: Text('${index + 1}',
                  style: TextStyle(color: cs.primary, fontWeight: FontWeight.w700)),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text((loc.area ?? '').toUpperCase(),
                  style: TextStyle(
                      fontSize: 11,
                      letterSpacing: 1,
                      color: cs.onSurfaceVariant,
                      fontWeight: FontWeight.w700)),
            ),
            if (nearest)
              Text(lang.t('location.nearest'),
                  style: TextStyle(
                      color: cs.primary, fontSize: 11, fontWeight: FontWeight.w800)),
          ]),
          const SizedBox(height: 10),
          Text(loc.name, style: const TextStyle(fontWeight: FontWeight.w700)),
          const SizedBox(height: 6),
          InfoRow(Icons.place_outlined, loc.address),
          if (loc.phone != null && loc.phone!.isNotEmpty)
            InfoRow(Icons.phone, loc.phone!, onTap: () => callPhone(loc.phone!)),
          if (distance != null)
            InfoRow(Icons.navigation,
                '${distance!.km.toStringAsFixed(1)} km · ~${distance!.minutes} min'),
        ]),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({required this.lang});
  final LangState lang;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 24, 20, 32),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Logo(size: 32),
          const SizedBox(width: 10),
          Text('Best Foods', style: AppTheme.display(context, size: 22)),
        ]),
        const SizedBox(height: 10),
        Text(lang.t('footer.tagline'), style: TextStyle(color: cs.onSurfaceVariant)),
        const SizedBox(height: 10),
        Wrap(spacing: 8, children: [
          TextButton(
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const AboutScreen())),
            child: Text(lang.t('footer.about')),
          ),
          TextButton(
            onPressed: () => Navigator.of(context)
                .push(MaterialPageRoute(builder: (_) => const ContactScreen())),
            child: Text(lang.t('footer.contact')),
          ),
        ]),
        const SizedBox(height: 6),
        Text('© ${DateTime.now().year} Best Foods · Bilbao. ${lang.t('footer.rights')}',
            style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
      ]),
    );
  }
}
