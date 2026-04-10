import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    final shouldCollapse = _scrollController.offset > 100;
    if (shouldCollapse != _isStatusCollapsed) {
      setState(() => _isStatusCollapsed = shouldCollapse);
    }
  }

  bool _isStatusCollapsed = false;

  @override
  Widget build(BuildContext context) => const Scaffold(
        body: Center(child: Text('Coming soon')),
      );
}
