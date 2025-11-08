// lib/utils/auth_utils.dart

/// Common validation functions for authentication forms
class AuthValidators {
  /// Validates email format
  static String? validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your email';
    }
    final emailRegex = RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Please enter a valid email';
    }
    return null;
  }

  /// Validates password strength
  static String? validatePassword(String? value, {int minLength = 6}) {
    if (value == null || value.isEmpty) {
      return 'Please enter a password';
    }
    if (value.length < minLength) {
      return 'Password must be at least $minLength characters';
    }
    return null;
  }

  /// Validates full name
  static String? validateFullName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your full name';
    }
    if (value.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    return null;
  }

  /// Validates phone number (10 digits only)
  static String? validatePhoneNumber(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your phone number';
    }
    final phoneRegex = RegExp(r'^\d{10}$');
    if (!phoneRegex.hasMatch(value.trim())) {
      return 'Enter valid 10-digit phone number';
    }
    return null;
  }

  /// Validates confirm password matches password
  static String? validateConfirmPassword(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != password) {
      return 'Passwords do not match';
    }
    return null;
  }
}

/// Common error message parsing for authentication responses
class AuthErrorParser {
  /// Parses login error messages
  static String parseLoginError(String error) {
    if (error.contains('Invalid credentials') || error.contains('Invalid email or password')) {
      return 'Invalid email or password. Please try again.';
    } else if (error.contains('User not found')) {
      return 'No account found with this email.';
    } else if (error.contains('Network error') || error.contains('Connection timeout')) {
      return 'Network error. Please check your connection.';
    } else if (error.contains('Server not responding')) {
      return 'Server is not responding. Please try again later.';
    }
    return error;
  }

  /// Parses registration error messages
  static String parseRegisterError(String error) {
    if (error.contains('Email already exists') || error.contains('already registered')) {
      return 'An account with this email already exists.';
    } else if (error.contains('Phone number already exists')) {
      return 'This phone number is already registered.';
    } else if (error.contains('Network error') || error.contains('Connection timeout')) {
      return 'Network error. Please check your connection.';
    } else if (error.contains('Server not responding')) {
      return 'Server is not responding. Please try again later.';
    }
    return error;
  }
}
