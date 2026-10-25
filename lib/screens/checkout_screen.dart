import 'package:flutter/material.dart';
import 'package:flutter_stripe/flutter_stripe.dart'
    show SetupPaymentSheetParameters, Stripe, StripeException;
import 'package:provider/provider.dart';

import '../config.dart';
import '../models.dart';
import '../services/api.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'order_confirmed_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  String _orderType = 'delivery';
  String _payment = 'card';
  bool _processing = false;
  bool _locating = false;
  Map<String, Distance> _distances = {};

  late final Profile _p;
  late final Map<String, TextEditingController> _c;
  String _location = '';

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

  Future<void> _useLocation(List<Location> locations) async {
    final lang = context.read<LangState>();
    setState(() => _locating = true);
    try {
      final r = await locateNearest(locations);
      if (!mounted) return;
      final nearest = locations.where((l) => l.id == r.nearestId).firstOrNull;
      setState(() {
        _distances = r.distances;
        if (nearest != null) _location = nearest.name;
      });
      if (nearest != null) {
        toast(context, '${lang.t('location.nearest')}: ${nearest.name}');
      }
    } catch (_) {
      if (mounted) toast(context, lang.t('location.denied'), error: true);
    } finally {
      if (mounted) setState(() => _locating = false);
    }
  }

  Future<void> _placeOrder() async {
    final lang = context.read<LangState>();
    final cart = context.read<CartState>();
    final isDelivery = _orderType == 'delivery';

    if (_c['name']!.text.trim().isEmpty || _c['phone']!.text.trim().isEmpty) {
      toast(context,
          lang.lang == 'en' ? 'Name and phone required' : 'Nombre y teléfono requeridos',
          error: true);
      return;
    }
    if (_payment == 'card' && Config.stripePublishableKey.isEmpty) {
      toast(context, 'Stripe is not configured', error: true);
      return;
    }

    setState(() => _processing = true);
    try {
      final result = await Api.createOrder({
        'items': [
          for (final i in cart.items) {'id': i.item.id, 'quantity': i.quantity}
        ],
        'order_type': _orderType,
        'location_name': _location,
        'customer_name': _c['name']!.text.trim(),
        'customer_phone': _c['phone']!.text.trim(),
        'customer_email': _c['email']!.text.trim(),
        'address': isDelivery
            ? ['street', 'floor', 'area', 'zip']
                .map((k) => _c[k]!.text.trim())
                .where((s) => s.isNotEmpty)
                .join(', ')
            : '',
        'notes': '',
        'payment_method': _payment,
      });

      if (_payment == 'card') {
        await Stripe.instance.initPaymentSheet(
          paymentSheetParameters: SetupPaymentSheetParameters(
            paymentIntentClientSecret: result.clientSecret,
            merchantDisplayName: Restaurant.name,
            style: ThemeMode.system,
          ),
        );
        await Stripe.instance.presentPaymentSheet();
      }

      cart.clear();
      if (!mounted) return;
      Navigator.of(context).pushReplacement(MaterialPageRoute(
        builder: (_) => OrderConfirmedScreen(
            orderId: result.orderId, orderNumber: result.orderNumber),
      ));
    } on StripeException catch (e) {
      if (mounted) {
        toast(context, e.error.localizedMessage ?? 'Payment failed', error: true);
      }
    } catch (e) {
      if (mounted) toast(context, e.toString(), error: true);
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cart = context.watch<CartState>();
    final menu = context.watch<MenuState>();
    final cs = Theme.of(context).colorScheme;
    final locations = menu.locations;
    if (_location.isEmpty && locations.isNotEmpty) _location = locations.first.name;

    if (cart.items.isEmpty) {
      return Scaffold(
        appBar: AppBar(),
        body: Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(lang.t('checkout.empty'),
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: Text(lang.t('checkout.back')),
            ),
          ]),
        ),
      );
    }

    final isDelivery = _orderType == 'delivery';
    final fee = isDelivery ? cart.deliveryFee : 0.0;
    final total = cart.subtotal + fee;

    Widget section(String title, Widget child) => Padding(
          padding: const EdgeInsets.only(bottom: 14),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(title,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
                const SizedBox(height: 12),
                child,
              ]),
            ),
          ),
        );

    Widget field(String key, String label, {TextInputType? type, String? hint}) =>
        Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: TextField(
            controller: _c[key],
            keyboardType: type,
            decoration: InputDecoration(labelText: label, hintText: hint),
          ),
        );

    Widget choice(String value, String groupValue, IconData icon, String title,
            String subtitle, ValueChanged<String> onChanged) =>
        Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => onChanged(value),
            child: Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                    width: 2,
                    color: value == groupValue ? cs.primary : cs.outline),
                color: value == groupValue ? cs.primary.withValues(alpha: 0.05) : null,
              ),
              child: Row(children: [
                Icon(icon, color: cs.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    if (subtitle.isNotEmpty)
                      Text(subtitle,
                          style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
                  ]),
                ),
              ]),
            ),
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('checkout.title'), style: AppTheme.display(context, size: 22))),
      body: ListView(padding: const EdgeInsets.all(16), children: [
        section(
          lang.t('checkout.type'),
          Column(children: [
            choice('delivery', _orderType, Icons.local_shipping_outlined,
                lang.t('checkout.delivery'), lang.t('checkout.deliveryTime'),
                (v) => setState(() => _orderType = v)),
            choice('pickup', _orderType, Icons.storefront_outlined,
                lang.t('checkout.pickup'), lang.t('checkout.pickupTime'),
                (v) => setState(() => _orderType = v)),
          ]),
        ),
        section(
          lang.t('checkout.location'),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            OutlinedButton.icon(
              onPressed: _locating || locations.isEmpty ? null : () => _useLocation(locations),
              icon: _locating
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.navigation, size: 18),
              label: Text(lang.t('location.useMyLocation')),
            ),
            const SizedBox(height: 10),
            for (final l in locations)
              choice(
                l.name,
                _location,
                Icons.place_outlined,
                l.name,
                _distances[l.id] == null
                    ? ''
                    : '${_distances[l.id]!.km.toStringAsFixed(1)} km · ${_distances[l.id]!.minutes} min',
                (v) => setState(() => _location = v),
              ),
          ]),
        ),
        if (isDelivery)
          section(
            lang.t('checkout.address'),
            Column(children: [
              field('street', lang.t('checkout.street'), hint: 'C/Askao 4'),
              field('floor', lang.t('checkout.floor'), hint: '3º B'),
              field('area', lang.t('checkout.area'), hint: 'Casco Viejo'),
              field('zip', lang.t('checkout.zip'),
                  type: TextInputType.number, hint: '48005'),
            ]),
          ),
        section(
          lang.t('checkout.contact'),
          Column(children: [
            field('name', lang.t('checkout.name')),
            field('phone', lang.t('checkout.phone'), type: TextInputType.phone),
            field('email', lang.t('checkout.email'), type: TextInputType.emailAddress),
          ]),
        ),
        section(
          lang.t('checkout.payment'),
          Column(children: [
            choice('card', _payment, Icons.credit_card, lang.t('checkout.card'),
                lang.t('checkout.cardDesc'), (v) => setState(() => _payment = v)),
            choice('cash', _payment, Icons.payments_outlined, lang.t('checkout.cash'),
                lang.t('checkout.cashDesc'), (v) => setState(() => _payment = v)),
          ]),
        ),
        section(
          lang.t('checkout.summary'),
          Column(children: [
            for (final i in cart.items)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(children: [
                  Expanded(
                      child: Text('${i.quantity}× ${i.item.localizedName(lang.lang)}')),
                  Text(formatPrice(i.item.price * i.quantity)),
                ]),
              ),
            const Divider(height: 24),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(lang.t('cart.subtotal')),
              Text(formatPrice(cart.subtotal)),
            ]),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(lang.t('cart.delivery')),
              Text(fee == 0 ? lang.t('cart.free') : formatPrice(fee)),
            ]),
            const SizedBox(height: 6),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(lang.t('cart.total'),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
              Text(formatPrice(total),
                  style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 18)),
            ]),
            const SizedBox(height: 8),
            Align(
              alignment: Alignment.centerLeft,
              child: Text(
                '${lang.t('checkout.estimated')} ${isDelivery ? lang.t('checkout.deliveryTime') : lang.t('checkout.pickupTime')}',
                style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant),
              ),
            ),
          ]),
        ),
        FilledButton(
          onPressed: _processing ? null : _placeOrder,
          child: _processing
              ? Text(lang.t('checkout.processing'))
              : Text('${lang.t('checkout.confirm')} · ${formatPrice(total)}'),
        ),
        const SizedBox(height: 8),
        Center(
          child: Text(lang.t('checkout.secure'),
              style: TextStyle(fontSize: 12, color: cs.onSurfaceVariant)),
        ),
      ]),
    );
  }
}
