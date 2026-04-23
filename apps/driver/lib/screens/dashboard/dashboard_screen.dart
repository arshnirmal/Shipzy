import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'widgets/custom_bottom_nav_bar.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({required this.navigationShell, super.key});
  final StatefulNavigationShell navigationShell;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  void _goBranch(int index) {
    widget.navigationShell.goBranch(
      index,
      initialLocation: index == widget.navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    body: widget.navigationShell,
    bottomNavigationBar: CustomBottomNavBar(
      currentIndex: widget.navigationShell.currentIndex,
      onTap: _goBranch,
    ),
  );
}
