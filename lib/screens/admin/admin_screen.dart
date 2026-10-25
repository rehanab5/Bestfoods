import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../models.dart';
import '../../services/api.dart';
import '../../state/app_state.dart';
import '../../widgets/common.dart';

class AdminScreen extends StatefulWidget {
  const AdminScreen({super.key});

  @override
  State<AdminScreen> createState() => _AdminScreenState();
}

class _AdminScreenState extends State<AdminScreen> {
  bool? _isAdmin;
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;

  @override
  void initState() {
    super.initState();
    _check();
  }

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _check() async {
    final v = await Api.isAdmin().catchError((_) => false);
    if (mounted) setState(() => _isAdmin = v);
  }

  Future<void> _login() async {
    setState(() => _busy = true);
    try {
      await Api.adminSignIn(_email.text.trim(), _password.text);
      await _check();
      if (mounted && _isAdmin != true) {
        toast(context, 'Acceso restringido', error: true);
      }
    } catch (e) {
      if (mounted) toast(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _logout() async {
    await Api.adminSignOut();
    if (mounted) Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    if (_isAdmin == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    if (_isAdmin != true) {
      return Scaffold(
        appBar: AppBar(title: const Text('Admin')),
        body: ListView(padding: const EdgeInsets.all(24), children: [
          TextField(
              controller: _email,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email')),
          const SizedBox(height: 12),
          TextField(
              controller: _password,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Password')),
          const SizedBox(height: 16),
          FilledButton(
              onPressed: _busy ? null : _login, child: const Text('Iniciar sesión')),
        ]),
      );
    }

    return DefaultTabController(
      length: 3,
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Best Foods · Panel'),
          actions: [
            IconButton(onPressed: _logout, icon: const Icon(Icons.logout), tooltip: 'Salir'),
          ],
          bottom: const TabBar(tabs: [
            Tab(text: 'Menú'),
            Tab(text: 'Locales'),
            Tab(text: 'Reseñas'),
          ]),
        ),
        body: const TabBarView(children: [
          _MenuManager(),
          _LocationsManager(),
          _ReviewsManager(),
        ]),
      ),
    );
  }
}

typedef _FieldSpec = ({String key, String label, bool number, bool multiline});

_FieldSpec _f(String key, String label, {bool number = false, bool multiline = false}) =>
    (key: key, label: label, number: number, multiline: multiline);

/// Shows a form for [fields] pre-filled from [initial]; returns the values or null.
Future<Map<String, dynamic>?> _editDialog(BuildContext context, String title,
    List<_FieldSpec> fields, Map<String, dynamic> initial,
    {List<String>? categoryOptions, bool showDeal = false}) {
  final ctrls = {
    for (final f in fields) f.key: TextEditingController(text: '${initial[f.key] ?? ''}')
  };
  String? category = initial['category'] as String?;
  bool isDeal = initial['is_deal'] as bool? ?? false;

  return showDialog<Map<String, dynamic>>(
    context: context,
    builder: (ctx) => StatefulBuilder(
      builder: (ctx, setState) => AlertDialog(
        title: Text(title),
        content: SingleChildScrollView(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            for (final f in fields)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: TextField(
                  controller: ctrls[f.key],
                  maxLines: f.multiline ? 3 : 1,
                  keyboardType: f.number
                      ? const TextInputType.numberWithOptions(decimal: true)
                      : null,
                  decoration: InputDecoration(labelText: f.label),
                ),
              ),
            if (categoryOptions != null)
              DropdownButtonFormField<String>(
                initialValue: category,
                decoration: const InputDecoration(labelText: 'Categoría'),
                items: [
                  for (final c in categoryOptions)
                    DropdownMenuItem(value: c, child: Text(c)),
                ],
                onChanged: (v) => setState(() => category = v),
              ),
            if (showDeal)
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Menú / oferta'),
                value: isDeal,
                onChanged: (v) => setState(() => isDeal = v),
              ),
          ]),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
            onPressed: () {
              final out = <String, dynamic>{};
              for (final f in fields) {
                final text = ctrls[f.key]!.text.trim();
                out[f.key] = f.number ? num.tryParse(text.replaceAll(',', '.')) : (text.isEmpty ? null : text);
              }
              if (categoryOptions != null) out['category'] = category;
              if (showDeal) out['is_deal'] = isDeal;
              Navigator.pop(ctx, out);
            },
            child: const Text('Guardar'),
          ),
        ],
      ),
    ),
  );
}

Future<bool> _confirm(BuildContext context, String message) async =>
    await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        content: Text(message),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Sí')),
        ],
      ),
    ) ??
    false;

class _MenuManager extends StatelessWidget {
  const _MenuManager();

  static final _fields = [
    _f('name', 'Nombre'),
    _f('name_en', 'Name (EN)'),
    _f('description', 'Descripción', multiline: true),
    _f('description_en', 'Description (EN)', multiline: true),
    _f('price', 'Precio', number: true),
    _f('image', 'URL de imagen'),
    _f('badge', 'Etiqueta'),
    _f('sort_order', 'Orden', number: true),
  ];

  Future<void> _edit(BuildContext context, MenuItem? item) async {
    final menu = context.read<MenuState>();
    final initial = item == null
        ? <String, dynamic>{'is_deal': false, 'sort_order': 0}
        : {
            'name': item.name,
            'name_en': item.nameEn,
            'description': item.description,
            'description_en': item.descriptionEn,
            'price': item.price,
            'image': item.image,
            'badge': item.badge,
            'sort_order': item.sortOrder,
            'category': item.category,
            'is_deal': item.isDeal,
          };
    final v = await _editDialog(context, item == null ? 'Nuevo plato' : 'Editar plato',
        _fields, initial,
        categoryOptions: categories.map((c) => c.id).toList(), showDeal: true);
    if (v == null || v['name'] == null || v['price'] == null) return;
    v['sort_order'] ??= 0;
    try {
      await Api.saveRow('menu_items', item?.id, v);
      await menu.load();
    } catch (e) {
      if (context.mounted) toast(context, e.toString(), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final menu = context.watch<MenuState>();
    final all = [...menu.deals, ...menu.items];
    return Scaffold(
      floatingActionButton:
          FloatingActionButton(onPressed: () => _edit(context, null), child: const Icon(Icons.add)),
      body: ListView(children: [
        for (final m in all)
          ListTile(
            title: Text(m.name),
            subtitle: Text('${formatPrice(m.price)} · ${m.isDeal ? 'menú' : m.category ?? ''}'),
            onTap: () => _edit(context, m),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                if (!await _confirm(context, '¿Eliminar "${m.name}"?')) return;
                await Api.deleteRow('menu_items', m.id);
                await menu.load();
              },
            ),
          ),
      ]),
    );
  }
}

class _LocationsManager extends StatelessWidget {
  const _LocationsManager();

  static final _fields = [
    _f('name', 'Nombre'),
    _f('address', 'Dirección'),
    _f('area', 'Barrio'),
    _f('phone', 'Teléfono'),
    _f('lat', 'Latitud', number: true),
    _f('lng', 'Longitud', number: true),
    _f('sort_order', 'Orden', number: true),
  ];

  Future<void> _edit(BuildContext context, Location? l) async {
    final menu = context.read<MenuState>();
    final v = await _editDialog(
      context,
      l == null ? 'Nuevo local' : 'Editar local',
      _fields,
      l == null
          ? {'sort_order': 0}
          : {
              'name': l.name,
              'address': l.address,
              'area': l.area,
              'phone': l.phone,
              'lat': l.lat,
              'lng': l.lng,
              'sort_order': l.sortOrder,
            },
    );
    if (v == null || v['name'] == null || v['address'] == null) return;
    v['sort_order'] ??= 0;
    try {
      await Api.saveRow('locations', l?.id, v);
      await menu.load();
    } catch (e) {
      if (context.mounted) toast(context, e.toString(), error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final menu = context.watch<MenuState>();
    return Scaffold(
      floatingActionButton:
          FloatingActionButton(onPressed: () => _edit(context, null), child: const Icon(Icons.add)),
      body: ListView(children: [
        for (final l in menu.locations)
          ListTile(
            title: Text(l.name),
            subtitle: Text(l.address),
            onTap: () => _edit(context, l),
            trailing: IconButton(
              icon: const Icon(Icons.delete_outline),
              onPressed: () async {
                if (!await _confirm(context, '¿Eliminar "${l.name}"?')) return;
                await Api.deleteRow('locations', l.id);
                await menu.load();
              },
            ),
          ),
      ]),
    );
  }
}

class _ReviewsManager extends StatefulWidget {
  const _ReviewsManager();

  @override
  State<_ReviewsManager> createState() => _ReviewsManagerState();
}

class _ReviewsManagerState extends State<_ReviewsManager> {
  List<Review> _reviews = [];
  bool _loading = true;
  String _filter = 'pending';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final r = await Api.fetchReviews();
      if (mounted) setState(() => _reviews = r);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    final shown = _reviews.where((r) => switch (_filter) {
          'pending' => !r.approved,
          'approved' => r.approved,
          _ => true,
        });
    return Column(children: [
      Padding(
        padding: const EdgeInsets.all(8),
        child: SegmentedButton<String>(
          segments: const [
            ButtonSegment(value: 'pending', label: Text('Pendientes')),
            ButtonSegment(value: 'approved', label: Text('Aprobadas')),
            ButtonSegment(value: 'all', label: Text('Todas')),
          ],
          selected: {_filter},
          onSelectionChanged: (s) => setState(() => _filter = s.first),
        ),
      ),
      Expanded(
        child: ListView(children: [
          for (final r in shown)
            ListTile(
              title: Text('${r.author} · ${'★' * r.rating}'),
              subtitle: Text(r.description),
              isThreeLine: true,
              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                IconButton(
                  icon: Icon(r.approved ? Icons.close : Icons.check),
                  onPressed: () async {
                    await Api.setReviewApproved(r.id, !r.approved);
                    _load();
                  },
                ),
                IconButton(
                  icon: const Icon(Icons.delete_outline),
                  onPressed: () async {
                    if (!await _confirm(context, '¿Eliminar esta reseña?')) return;
                    await Api.deleteRow('reviews', r.id);
                    _load();
                  },
                ),
              ]),
            ),
        ]),
      ),
    ]);
  }
}
