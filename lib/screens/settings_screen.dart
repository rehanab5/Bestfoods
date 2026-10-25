import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models.dart';
import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'admin/admin_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late final Profile _p;
  late final Map<String, TextEditingController> _c;
  String _location = '';
  bool _deleting = false;

  @override
  void initState() {
    super.initState();
    _p = context.read<ProfileStore>().load();
    _location = _p.location;
    TextEditingController c(String v) => TextEditingController(text: v);
    _c = {
      'name': c(_p.name),
      'phone': c(_p.phone),
      'email': c(_p.email),
      'street': c(_p.street),
      'floor': c(_p.floor),
      'area': c(_p.area),
      'zip': c(_p.zip),
    };
  }

  @override
  void dispose() {
    for (final c in _c.values) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    final lang = context.read<LangState>();
    await context.read<ProfileStore>().save(Profile(
          name: _c['name']!.text.trim(),
          phone: _c['phone']!.text.trim(),
          email: _c['email']!.text.trim(),
          street: _c['street']!.text.trim(),
          floor: _c['floor']!.text.trim(),
          area: _c['area']!.text.trim(),
          zip: _c['zip']!.text.trim(),
          location: _location,
        ));
    if (mounted) toast(context, lang.t('account.saved'));
  }

  Future<void> _delete() async {
    final lang = context.read<LangState>();
    final store = context.read<ProfileStore>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(lang.t('settings.deleteTitle')),
        content: Text(lang.t('settings.deleteDialog')),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: Text(lang.t('settings.cancel'))),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              style: TextButton.styleFrom(
                  foregroundColor: Theme.of(ctx).colorScheme.error),
              child: Text(lang.t('settings.confirm'))),
        ],
      ),
    );
    if (ok != true) return;

    setState(() => _deleting = true);
    try {
      await Api.deleteAccount();
      await store.clear();
      if (!mounted) return;
      for (final c in _c.values) {
        c.clear();
      }
      setState(() => _location = '');
      toast(context, 'Cuenta eliminada correctamente');
    } catch (e) {
      if (mounted) toast(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _deleting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final menu = context.watch<MenuState>();
    final cs = Theme.of(context).colorScheme;

    Widget field(String key, String label, {TextInputType? type}) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: TextField(
            controller: _c[key],
            keyboardType: type,
            decoration: InputDecoration(labelText: label),
          ),
        );

    final names = menu.locations.map((l) => l.name).toList();

    return ListView(padding: const EdgeInsets.all(16), children: [
      // Long-press the title to reach the admin panel.
      GestureDetector(
        onLongPress: () => Navigator.of(context)
            .push(MaterialPageRoute(builder: (_) => const AdminScreen())),
        child: Text(lang.t('account.title'), style: AppTheme.display(context, size: 32)),
      ),
      const SizedBox(height: 4),
      Text(lang.t('account.subtitle'), style: TextStyle(color: cs.onSurfaceVariant)),
      const SizedBox(height: 16),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lang.t('account.personal'),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            field('name', lang.t('checkout.name')),
            field('phone', lang.t('checkout.phone'), type: TextInputType.phone),
            field('email', lang.t('checkout.email'), type: TextInputType.emailAddress),
            const SizedBox(height: 6),
            Text(lang.t('account.defaultAddress'),
                style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
            const SizedBox(height: 12),
            field('street', lang.t('checkout.street')),
            field('floor', lang.t('checkout.floor')),
            field('area', lang.t('checkout.area')),
            field('zip', lang.t('checkout.zip'), type: TextInputType.number),
            DropdownButtonFormField<String>(
              initialValue: names.contains(_location) ? _location : null,
              decoration: InputDecoration(labelText: lang.t('account.defaultLocation')),
              items: [
                for (final n in names) DropdownMenuItem(value: n, child: Text(n)),
              ],
              onChanged: (v) => setState(() => _location = v ?? ''),
            ),
            const SizedBox(height: 14),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _save,
                icon: const Icon(Icons.save, size: 18),
                label: Text(lang.t('account.save')),
              ),
            ),
          ]),
        ),
      ),
      const SizedBox(height: 16),
      Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(lang.t('settings.delete'),
                style: TextStyle(
                    fontWeight: FontWeight.w700, fontSize: 16, color: cs.error)),
            const SizedBox(height: 4),
            Text(lang.t('settings.deleteDesc'),
                style: TextStyle(color: cs.onSurfaceVariant)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _deleting ? null : _delete,
              style: OutlinedButton.styleFrom(foregroundColor: cs.error),
              icon: const Icon(Icons.delete_outline, size: 18),
              label: Text(_deleting
                  ? lang.t('settings.deleting')
                  : lang.t('settings.deleteBtn')),
            ),
          ]),
        ),
      ),
    ]);
  }
}
