import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/app_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'cart_sheet.dart';
import 'home_screen.dart';
import 'orders_screen.dart';
import 'settings_screen.dart';

class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _tab = 0;
  int _ordersVersion = 0;

  void _select(int i) {
    final cartOpen = i == 1;
    if (cartOpen) {
      showCartSheet(context);
      return;
    }
    setState(() {
      _tab = i == 0 ? 0 : (i == 2 ? 1 : 2);
      if (i == 2) _ordersVersion++;
    });
  }

  int get _navIndex => _tab == 0 ? 0 : (_tab == 1 ? 2 : 3);

  @override
  Widget build(BuildContext context) {
    final lang = context.watch<LangState>();
    final cart = context.watch<CartState>();

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 16,
        title: Row(children: [
          const Logo(size: 32),
          const SizedBox(width: 10),
          Text('Best Foods', style: AppTheme.display(context, size: 22)),
        ]),
        actions: [
          TextButton(
            onPressed: lang.toggle,
            child: Text(lang.lang == 'es' ? 'EN' : 'ES'),
          ),
          const SizedBox(width: 4),
        ],
      ),
      body: IndexedStack(index: _tab, children: [
        const HomeScreen(),
        OrdersScreen(key: ValueKey('orders-$_ordersVersion')),
        const SettingsScreen(),
      ]),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _navIndex,
        onDestinationSelected: _select,
        destinations: [
          NavigationDestination(
              icon: const Icon(Icons.home_outlined),
              selectedIcon: const Icon(Icons.home),
              label: lang.t('nav.home')),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: cart.totalItems > 0,
              label: Text('${cart.totalItems}'),
              child: const Icon(Icons.shopping_bag_outlined),
            ),
            label: lang.t('nav.cart'),
          ),
          NavigationDestination(
              icon: const Icon(Icons.receipt_long_outlined),
              selectedIcon: const Icon(Icons.receipt_long),
              label: lang.t('nav.orders')),
          NavigationDestination(
              icon: const Icon(Icons.settings_outlined),
              selectedIcon: const Icon(Icons.settings),
              label: lang.t('nav.settings')),
        ],
      ),
    );
  }
}
