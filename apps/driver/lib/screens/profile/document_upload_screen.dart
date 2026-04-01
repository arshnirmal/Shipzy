import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class DocumentUploadScreen extends ConsumerStatefulWidget {
  const DocumentUploadScreen({super.key});

  @override
  ConsumerState<DocumentUploadScreen> createState() => _DocumentUploadScreenState();
}

class _DocumentUploadScreenState extends ConsumerState<DocumentUploadScreen> {
  bool _isLoading = false;
  // TODO: Add state for uploaded documents

  Future<void> _uploadDocument(String type) async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery);

    if (image != null) {
      // TODO: Implement actual upload logic
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Document selected (Placeholder)')));
    }
  }

  Future<void> _submitDocuments() async {
    setState(() => _isLoading = true);
    try {
      // TODO: Call API to submit documents
      await Future.delayed(const Duration(seconds: 1)); // Simulate API call
      if (mounted) context.go('/home');
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to submit documents: ${e.toString()}')));
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: const Text('Upload Documents')),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text('Required Documents', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              const Text('Please upload clear photos of the following documents to verify your identity.', style: TextStyle(color: Colors.grey)),
              const SizedBox(height: 24),
              _buildDocumentItem('Driving License', () => _uploadDocument('license')),
              const SizedBox(height: 16),
              _buildDocumentItem('Vehicle Registration', () => _uploadDocument('registration')),
              const SizedBox(height: 16),
              _buildDocumentItem('Insurance', () => _uploadDocument('insurance')),
              const SizedBox(height: 32),
              ElevatedButton(
                onPressed: _isLoading ? null : _submitDocuments,
                child: _isLoading ? const CircularProgressIndicator() : const Text('Submit for Verification'),
              ),
            ],
          ),
        ),
      ),
    );

  Widget _buildDocumentItem(String title, VoidCallback onTap) => Card(
      child: ListTile(title: Text(title), trailing: const Icon(Icons.upload_file), onTap: onTap),
    );
}
