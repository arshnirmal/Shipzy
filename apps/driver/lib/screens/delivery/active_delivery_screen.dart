import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../models/order_address.dart';
import '../../providers/home_provider.dart';
import '../../providers/order_provider.dart';
import '../../services/api_service.dart';
import '../../services/cloudinary_service.dart';
import '../../utils/snackbar_utils.dart';
import '../../widgets/map_widget.dart';

class ActiveDeliveryScreen extends ConsumerStatefulWidget {
  const ActiveDeliveryScreen({required this.orderId, super.key});

  final String orderId;

  @override
  ConsumerState<ActiveDeliveryScreen> createState() => _ActiveDeliveryScreenState();
}

class _ActiveDeliveryScreenState extends ConsumerState<ActiveDeliveryScreen> {
  Timer? _countdownTicker;
  DateTime _now = DateTime.now();
  bool _isActionInProgress = false;
  bool _hasOpenedPodSheet = false;

  @override
  void dispose() {
    _countdownTicker?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final orderState = ref.watch(orderProvider);
    final notifier = ref.read(orderProvider.notifier);
    final assignment = ref.watch(activeOrderProvider).valueOrNull;

    final contactAddress = _isPrePickupPhase(orderState.status) ? assignment?.routing.pickup : assignment?.routing.delivery;

    ref.listen<OrderState>(orderProvider, (previous, next) {
      _syncCountdownTicker(next);

      if (previous?.status != OrderStatus.delivered && next.status == OrderStatus.delivered && !_hasOpenedPodSheet) {
        _hasOpenedPodSheet = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _showProofOfDeliveryBottomSheet();
          }
        });
      }
    });

    final remaining = _remainingDuration(orderState.waitUntil);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Active Delivery'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () {
            showDialog(
              context: context,
              builder: (context) => AlertDialog(
                title: const Text('Cancel Delivery?'),
                content: const Text('Are you sure you want to cancel this delivery? This may affect your rating.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context), child: const Text('No')),
                  TextButton(
                    onPressed: () {
                      Navigator.pop(context);
                      context.go('/home');
                    },
                    child: const Text('Yes, Cancel'),
                  ),
                ],
              ),
            );
          },
        ),
      ),
      body: Column(
        children: [
          const Expanded(child: MapWidget()),
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).scaffoldBackgroundColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_getStatusText(orderState.status), style: Theme.of(context).textTheme.headlineSmall),
                if (orderState.status == OrderStatus.arrivedAtDropoff) ...[
                  const SizedBox(height: 8),
                  Text(
                    orderState.waitElapsed
                        ? 'Wait period completed. You can mark this order as undeliverable.'
                        : 'Wait period ends in ${_formatDuration(remaining)}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                const SizedBox(height: 16),
                _buildContactTile(contactAddress),
                const SizedBox(height: 24),
                _buildActions(context, orderState, notifier, remaining),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactTile(OrderAddress? address) {
    final name = address?.contactName;
    final phone = address?.contactPhone;

    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: const CircleAvatar(child: Icon(Icons.person)),
      title: Text(name ?? 'Loading...'),
      subtitle: phone != null ? Text(phone) : null,
      trailing: phone != null
          ? IconButton(
              icon: const Icon(Icons.call),
              onPressed: () => _launchPhone(phone),
            )
          : null,
    );
  }

  bool _isPrePickupPhase(OrderStatus status) {
    switch (status) {
      case OrderStatus.accepted:
      case OrderStatus.navigatingToPickup:
      case OrderStatus.arrivedAtPickup:
        return true;
      case OrderStatus.idle:
      case OrderStatus.pickedUp:
      case OrderStatus.navigatingToDropoff:
      case OrderStatus.arrivedAtDropoff:
      case OrderStatus.delivered:
      case OrderStatus.undeliverable:
      case OrderStatus.returning:
      case OrderStatus.returned:
        return false;
    }
  }

  String _getStatusText(OrderStatus status) {
    switch (status) {
      case OrderStatus.idle:
        return 'Unknown Status';
      case OrderStatus.accepted:
        return 'Head to Pickup';
      case OrderStatus.navigatingToPickup:
        return 'Navigating to Pickup';
      case OrderStatus.arrivedAtPickup:
        return 'Arrived at Pickup';
      case OrderStatus.pickedUp:
        return 'Head to Dropoff';
      case OrderStatus.navigatingToDropoff:
        return 'Navigating to Dropoff';
      case OrderStatus.arrivedAtDropoff:
        return 'Arrived at Dropoff';
      case OrderStatus.delivered:
        return 'Delivered';
      case OrderStatus.undeliverable:
        return 'Marked Undeliverable';
      case OrderStatus.returning:
        return 'Return to Sender';
      case OrderStatus.returned:
        return 'Returned to Sender';
    }
  }

  String _getPrimaryActionText(OrderStatus status) {
    switch (status) {
      case OrderStatus.idle:
        return 'Continue';
      case OrderStatus.accepted:
        return 'Start Navigation to Pickup';
      case OrderStatus.navigatingToPickup:
        return 'Arrived at Pickup';
      case OrderStatus.arrivedAtPickup:
        return 'Confirm Pickup';
      case OrderStatus.pickedUp:
        return 'Start Navigation to Dropoff';
      case OrderStatus.navigatingToDropoff:
        return 'Arrived at Dropoff';
      case OrderStatus.arrivedAtDropoff:
        return 'Mark Delivered';
      case OrderStatus.delivered:
        return 'Done';
      case OrderStatus.undeliverable:
        return 'Start Return';
      case OrderStatus.returning:
        return 'Confirm Returned';
      case OrderStatus.returned:
        return 'Done';
    }
  }

  Widget _buildActions(BuildContext context, OrderState state, Order notifier, Duration remaining) {
    switch (state.status) {
      case OrderStatus.arrivedAtDropoff:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              onPressed: _isActionInProgress
                  ? null
                  : () => _runAction(() async {
                      await notifier.completeDelivery(widget.orderId);
                    }),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: Text(_getPrimaryActionText(state.status)),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _isActionInProgress || !state.waitElapsed
                  ? null
                  : () => _showUndeliverableBottomSheet(waitUntil: state.waitUntil, remaining: remaining),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: const Text('Mark Undeliverable'),
            ),
          ],
        );
      case OrderStatus.delivered:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            ElevatedButton(
              onPressed: _isActionInProgress ? null : _showProofOfDeliveryBottomSheet,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: const Text('Add Proof of Delivery (Optional)'),
            ),
            const SizedBox(height: 12),
            OutlinedButton(
              onPressed: _isActionInProgress
                  ? null
                  : () {
                      notifier.closeActiveOrderFlow();
                      context.go('/home');
                    },
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.all(16)),
              child: const Text('Done'),
            ),
          ],
        );
      case OrderStatus.undeliverable:
        return ElevatedButton(
          onPressed: _isActionInProgress
              ? null
              : () => _runAction(() async {
                  await notifier.startReturn(widget.orderId);
                }),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
          child: Text(_getPrimaryActionText(state.status)),
        );
      case OrderStatus.returning:
        return ElevatedButton(
          onPressed: _isActionInProgress
              ? null
              : () => _runAction(() async {
                  await notifier.confirmReturned(widget.orderId);
                }),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
          child: Text(_getPrimaryActionText(state.status)),
        );
      case OrderStatus.returned:
        return ElevatedButton(
          onPressed: () {
            notifier.closeActiveOrderFlow();
            context.go('/home');
          },
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
          child: const Text('Done'),
        );
      case OrderStatus.idle:
      case OrderStatus.accepted:
      case OrderStatus.navigatingToPickup:
      case OrderStatus.arrivedAtPickup:
      case OrderStatus.pickedUp:
      case OrderStatus.navigatingToDropoff:
        return ElevatedButton(
          onPressed: _isActionInProgress ? null : () => _handlePrimaryAction(state.status, notifier),
          style: ElevatedButton.styleFrom(padding: const EdgeInsets.all(16)),
          child: Text(_getPrimaryActionText(state.status)),
        );
    }
  }

  Future<void> _handlePrimaryAction(OrderStatus status, Order notifier) async {
    final assignment = ref.read(activeOrderProvider).valueOrNull;

    switch (status) {
      case OrderStatus.idle:
        return;
      case OrderStatus.accepted:
        final pickup = assignment?.routing.pickup;
        await _runAction(() async {
          await notifier.startNavigation(widget.orderId);
          if (pickup != null) {
            await _launchNavigation(pickup.latitude, pickup.longitude);
          }
        });
        return;
      case OrderStatus.navigatingToPickup:
        await _runAction(() => notifier.arriveAtPickup(widget.orderId));
        return;
      case OrderStatus.arrivedAtPickup:
        await _runAction(() => notifier.confirmPickup(widget.orderId));
        return;
      case OrderStatus.pickedUp:
        final delivery = assignment?.routing.delivery;
        await _runAction(() async {
          await notifier.startDropoffNavigation(widget.orderId);
          if (delivery != null) {
            await _launchNavigation(delivery.latitude, delivery.longitude);
          }
        });
        return;
      case OrderStatus.navigatingToDropoff:
        await _runAction(() => notifier.arriveAtDelivery(widget.orderId));
        return;
      case OrderStatus.arrivedAtDropoff:
      case OrderStatus.delivered:
      case OrderStatus.undeliverable:
      case OrderStatus.returning:
      case OrderStatus.returned:
        return;
    }
  }

  Future<void> _runAction(Future<void> Function() action) async {
    if (_isActionInProgress) {
      return;
    }

    setState(() => _isActionInProgress = true);
    try {
      await action();
    } catch (e) {
      if (!mounted) {
        return;
      }
      SnackbarUtils.showError(context, e.toString());
    } finally {
      if (mounted) {
        setState(() => _isActionInProgress = false);
      }
    }
  }

  Future<void> _launchPhone(String phone) async {
    final uri = Uri(scheme: 'tel', path: phone);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  Future<void> _launchNavigation(double lat, double lng) async {
    final geoUri = Uri(scheme: 'geo', path: '$lat,$lng', queryParameters: {'q': '$lat,$lng'});
    if (await canLaunchUrl(geoUri)) {
      await launchUrl(geoUri);
      return;
    }
    final mapsUri = Uri.parse('https://maps.google.com/?daddr=$lat,$lng');
    if (await canLaunchUrl(mapsUri)) {
      await launchUrl(mapsUri, mode: LaunchMode.externalApplication);
    }
  }

  void _syncCountdownTicker(OrderState state) {
    final shouldRun = state.status == OrderStatus.arrivedAtDropoff && state.waitUntil != null && !state.waitElapsed;
    if (!shouldRun) {
      _countdownTicker?.cancel();
      _countdownTicker = null;
      return;
    }

    _now = DateTime.now();
    if (_countdownTicker != null) {
      return;
    }

    _countdownTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (mounted) {
        setState(() {
          _now = DateTime.now();
        });
      }
    });
  }

  Duration _remainingDuration(DateTime? waitUntil) {
    if (waitUntil == null) {
      return Duration.zero;
    }
    final difference = waitUntil.difference(_now);
    return difference.isNegative ? Duration.zero : difference;
  }

  String _formatDuration(Duration duration) {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  Future<void> _showUndeliverableBottomSheet({required DateTime? waitUntil, required Duration remaining}) async {
    final noteController = TextEditingController();
    final imagePicker = ImagePicker();
    String? photoUrl;
    var isUploading = false;
    var isSubmitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> uploadPhoto() async {
            final image = await imagePicker.pickImage(source: ImageSource.camera, imageQuality: 80);
            if (image == null || !context.mounted) {
              return;
            }

            setModalState(() => isUploading = true);
            try {
              final uploaded = await ref.read(cloudinaryServiceProvider).uploadDeliveryPhoto(image);
              if (context.mounted) {
                setModalState(() => photoUrl = uploaded);
              }
            } catch (e) {
              if (context.mounted) {
                SnackbarUtils.showError(context, 'Photo upload failed: $e');
              }
            } finally {
              if (context.mounted) {
                setModalState(() => isUploading = false);
              }
            }
          }

          Future<void> submitUndeliverable() async {
            final note = noteController.text.trim();
            if (note.isEmpty) {
              SnackbarUtils.showError(context, 'Driver note is required');
              return;
            }

            setModalState(() => isSubmitting = true);
            try {
              await ref.read(orderProvider.notifier).submitUndeliverable(widget.orderId, note: note, photoUrl: photoUrl);
              if (context.mounted) {
                Navigator.pop(context);
                SnackbarUtils.showSuccess(context, 'Marked as undeliverable');
              }
            } on RetryAfterException catch (e) {
              if (context.mounted) {
                SnackbarUtils.showInfo(context, 'Wait period not elapsed. Retry after ${e.retryAfter.toLocal()}.');
              }
            } catch (e) {
              if (context.mounted) {
                SnackbarUtils.showError(context, 'Failed to mark undeliverable: $e');
              }
            } finally {
              if (context.mounted) {
                setModalState(() => isSubmitting = false);
              }
            }
          }

          return Padding(
            padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Mark Undeliverable', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 8),
                  Text(
                    waitUntil == null ? 'Provide details before starting return.' : 'Remaining wait: ${_formatDuration(remaining)}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    controller: noteController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Driver Note *', hintText: 'Recipient unavailable, no response at door, etc.'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: isUploading || isSubmitting ? null : uploadPhoto,
                    icon: isUploading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.add_a_photo_outlined),
                    label: Text(photoUrl == null ? 'Add Photo' : 'Retake Photo'),
                  ),
                  if (photoUrl != null) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(photoUrl!, height: 120, fit: BoxFit.cover),
                    ),
                  ],
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: isSubmitting || isUploading ? null : submitUndeliverable,
                    child: isSubmitting
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Text('Submit Undeliverable'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );

    noteController.dispose();
  }

  Future<void> _showProofOfDeliveryBottomSheet() async {
    final recipientNameController = TextEditingController();
    final signatureUrlController = TextEditingController();
    final notesController = TextEditingController();
    final imagePicker = ImagePicker();
    String? photoUrl;
    var isUploading = false;
    var isSubmitting = false;

    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (sheetContext) => StatefulBuilder(
        builder: (context, setModalState) {
          Future<void> uploadPhoto() async {
            final image = await imagePicker.pickImage(source: ImageSource.camera, imageQuality: 80);
            if (image == null || !context.mounted) {
              return;
            }

            setModalState(() => isUploading = true);
            try {
              final uploaded = await ref.read(cloudinaryServiceProvider).uploadDeliveryPhoto(image);
              if (context.mounted) {
                setModalState(() => photoUrl = uploaded);
              }
            } catch (e) {
              if (context.mounted) {
                SnackbarUtils.showError(context, 'Photo upload failed: $e');
              }
            } finally {
              if (context.mounted) {
                setModalState(() => isUploading = false);
              }
            }
          }

          Future<void> submitProof() async {
            setModalState(() => isSubmitting = true);
            try {
              await ref
                  .read(orderProvider.notifier)
                  .submitProofOfDelivery(
                    widget.orderId,
                    recipientName: recipientNameController.text.trim().isEmpty ? null : recipientNameController.text.trim(),
                    photoUrl: photoUrl,
                    recipientSignatureUrl: signatureUrlController.text.trim().isEmpty ? null : signatureUrlController.text.trim(),
                    deliveryNotes: notesController.text.trim().isEmpty ? null : notesController.text.trim(),
                  );
              if (context.mounted) {
                Navigator.pop(context);
                SnackbarUtils.showSuccess(context, 'Proof of delivery submitted');
              }
            } catch (e) {
              if (context.mounted) {
                SnackbarUtils.showError(context, 'Failed to submit proof of delivery: $e');
              }
            } finally {
              if (context.mounted) {
                setModalState(() => isSubmitting = false);
              }
            }
          }

          return Padding(
            padding: EdgeInsets.only(left: 16, right: 16, top: 16, bottom: MediaQuery.of(context).viewInsets.bottom + 16),
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Proof of Delivery (Optional)', style: Theme.of(context).textTheme.titleLarge),
                  const SizedBox(height: 12),
                  TextField(
                    controller: recipientNameController,
                    decoration: const InputDecoration(labelText: 'Recipient Name'),
                  ),
                  const SizedBox(height: 12),
                  OutlinedButton.icon(
                    onPressed: isUploading || isSubmitting ? null : uploadPhoto,
                    icon: isUploading
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                        : const Icon(Icons.camera_alt_outlined),
                    label: Text(photoUrl == null ? 'Add Delivery Photo' : 'Retake Delivery Photo'),
                  ),
                  if (photoUrl != null) ...[
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(photoUrl!, height: 120, fit: BoxFit.cover),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: signatureUrlController,
                    decoration: const InputDecoration(labelText: 'Recipient Signature URL'),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: notesController,
                    maxLines: 3,
                    decoration: const InputDecoration(labelText: 'Delivery Notes'),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: isSubmitting || isUploading
                              ? null
                              : () {
                                  Navigator.pop(context);
                                  SnackbarUtils.showInfo(context, 'Skipped proof of delivery');
                                },
                          child: const Text('Skip'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: isSubmitting || isUploading ? null : submitProof,
                          child: isSubmitting
                              ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                              : const Text('Submit'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );

    recipientNameController.dispose();
    signatureUrlController.dispose();
    notesController.dispose();
  }
}
