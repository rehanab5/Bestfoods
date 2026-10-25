import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';

import '../config.dart';
import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class ContactScreen extends StatefulWidget {
  const ContactScreen({super.key});

  @override
  State<ContactScreen> createState() => _ContactScreenState();
}

class _ContactScreenState extends State<ContactScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _message = TextEditingController();

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _message.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final lang = context.read<LangState>();
    if (_message.text.trim().isEmpty) return;
    final body = '${_message.text}\n\n— ${_name.text} <${_email.text}>';
    final ok = await launchUrl(Uri(
      scheme: 'mailto',
      path: Restaurant.email,
      query: 'subject=${Uri.encodeComponent('Contacto Best Foods')}'
          '&body=${Uri.encodeComponent(body)}',
    ));
    if (!mounted) return;
    if (ok) {
      _name.clear();
      _email.clear();
      _message.clear();
      toast(context, lang.t('contact.sent'));
    } else {
      toast(context, Restaurant.email, error: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cs = Theme.of(context).colorScheme;

    Widget tile(IconData icon, String title, String value, VoidCallback? onTap) =>
        Card(
          child: InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: onTap,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Icon(icon, color: cs.primary),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                    Text(value, style: TextStyle(color: cs.onSurfaceVariant)),
                  ]),
                ),
              ]),
            ),
          ),
        );

    return Scaffold(
      appBar: AppBar(title: Text(lang.t('contact.back'))),
      body: ListView(padding: const EdgeInsets.all(20), children: [
        Text(lang.t('contact.title'), style: AppTheme.display(context, size: 30)),
        const SizedBox(height: 10),
        Text(lang.t('contact.desc'), style: TextStyle(color: cs.onSurfaceVariant)),
        const SizedBox(height: 18),
        tile(Icons.phone, lang.t('contact.phone'), Restaurant.phone,
            () => callPhone(Restaurant.phone)),
        const SizedBox(height: 10),
        tile(Icons.mail_outline, lang.t('contact.email'), Restaurant.email,
            () => launchUrl(Uri(scheme: 'mailto', path: Restaurant.email))),
        const SizedBox(height: 10),
        tile(Icons.schedule, lang.t('contact.hours'),
            '${Restaurant.hoursLunch} · ${Restaurant.hoursDinner}', null),
        const SizedBox(height: 24),
        Text(lang.t('contact.writeMessage'),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 12),
        TextField(
            controller: _name,
            decoration: InputDecoration(
                labelText: lang.t('contact.name'), hintText: lang.t('contact.namePh'))),
        const SizedBox(height: 10),
        TextField(
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            decoration: InputDecoration(labelText: lang.t('contact.email'))),
        const SizedBox(height: 10),
        TextField(
            controller: _message,
            minLines: 4,
            maxLines: 6,
            decoration: InputDecoration(
                labelText: lang.t('contact.message'),
                hintText: lang.t('contact.messagePh'))),
        const SizedBox(height: 14),
        FilledButton.icon(
          onPressed: _send,
          icon: const Icon(Icons.send, size: 18),
          label: Text(lang.t('contact.send')),
        ),
      ]),
    );
  }
}
