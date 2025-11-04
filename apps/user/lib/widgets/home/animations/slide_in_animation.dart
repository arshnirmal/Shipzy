// lib/widgets/home/animations/slide_in_animation.dart

import 'package:flutter/material.dart';

class SlideInAnimation extends StatefulWidget {
  const SlideInAnimation({
    required this.child,

    this.index = 0,

    this.duration = const Duration(milliseconds: 400),

    this.delay = const Duration(milliseconds: 100),

    super.key,
  });

  final Widget child;

  final int index;

  final Duration duration;

  final Duration delay;

  @override
  State<SlideInAnimation> createState() => _SlideInAnimationState();
}

class _SlideInAnimationState extends State<SlideInAnimation>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  late Animation<Offset> _slideAnimation;

  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();

    _controller = AnimationController(duration: widget.duration, vsync: this);

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),

      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(_controller);

    // Stagger animation based on index

    Future.delayed(widget.delay * widget.index, () {
      if (mounted) {
        _controller.forward();
      }
    });
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
    opacity: _fadeAnimation,
    child: SlideTransition(position: _slideAnimation, child: widget.child),
  );

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}
