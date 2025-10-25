# 📦 Shipzy Shared Types

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)

> Shared TypeScript type definitions for the Shipzy hyperlocal delivery platform

---

## 📋 Overview

The `@shipzy/shared-types` package provides centralized TypeScript type definitions used across the Shipzy monorepo. This ensures type safety and consistency between the backend API and frontend applications.

### 📁 Package Contents

```
packages/shared-types/
├── driver.types.ts      # Driver-related type definitions
├── order.types.ts       # Order and delivery type definitions
├── user.types.ts        # User authentication type definitions
└── README.md           # This documentation
```

---

## 🔧 Installation

### For Backend (Node.js/TypeScript)

```bash
# From services/backend/
npm install ../packages/shared-types
```

### For Frontend Applications (Flutter/Dart)

Since this is a TypeScript package, frontend apps should generate their own type definitions from the API responses or use the types as reference for creating equivalent Dart classes.

---

## 📚 Type Definitions

### User Types (`user.types.ts`)

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: "user" | "driver" | "admin";
  createdAt: Date;
  updatedAt?: Date;
}

interface CreateUserRequest {
  email: string;
  name: string;
  phone?: string;
  password: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  token: string;
}
```

### Order Types (`order.types.ts`)

```typescript
interface Order {
  id: string;
  userId: string;
  driverId?: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";
  createdAt: Date;
  updatedAt?: Date;
}

interface CreateOrderRequest {
  userId: string;
  pickupLocation: {
    lat: number;
    lng: number;
    address: string;
  };
  dropoffLocation: {
    lat: number;
    lng: number;
    address: string;
  };
}

type OrderStatus = Order["status"];
```

### Driver Types (`driver.types.ts`)

```typescript
interface Driver extends User {
  vehicleType: string;
  licenseNumber: string;
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  rating?: number;
}

interface UpdateDriverAvailability {
  isAvailable: boolean;
  currentLocation?: {
    lat: number;
    lng: number;
  };
}
```

---

## 🚀 Usage

### Backend Integration

```typescript
// services/backend/src/types/index.ts
import { User, Order, Driver } from "@shipzy/shared-types";

// Use types in your backend code
interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

function getUserProfile(userId: string): Promise<ApiResponse<User>> {
  // Implementation
}
```

### Frontend Reference

```dart
// apps/user/lib/models/user.dart (equivalent Dart class)
class User {
  final String id;
  final String email;
  final String name;
  final String? phone;
  final UserRole role;
  final DateTime createdAt;
  final DateTime? updatedAt;

  User({
    required this.id,
    required this.email,
    required this.name,
    this.phone,
    required this.role,
    required this.createdAt,
    this.updatedAt,
  });

  // Factory constructor from JSON
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      email: json['email'],
      name: json['name'],
      phone: json['phone'],
      role: UserRole.values[json['role']],
      createdAt: DateTime.parse(json['createdAt']),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }
}
```

---

## 🛠️ Development

### Adding New Types

1. **Create or update type files** in the appropriate `.types.ts` file
2. **Follow naming conventions**:
   - Interfaces: `PascalCase`
   - Properties: `camelCase`
   - Enums: `PascalCase`
3. **Add comprehensive JSDoc comments** for complex types
4. **Export all new types** from their respective files

### Type Organization Guidelines

- **Domain-driven design**: Group types by business domain (user, order, driver)
- **Consistent naming**: Use clear, descriptive names
- **Optional properties**: Use `?:` for optional properties
- **Union types**: Prefer union types over enums for simple cases
- **Generic interfaces**: Use generics for reusable patterns

### Example: Adding Payment Types

```typescript
// payment.types.ts
export interface PaymentMethod {
  id: string;
  name: "card" | "upi" | "cod" | "wallet";
  displayName: string;
  isActive: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  status: "pending" | "completed" | "failed" | "refunded";
  createdAt: Date;
  completedAt?: Date;
}
```

---

## 🧪 Testing

```bash
# Run type checking
npx tsc --noEmit

# Run tests (if any)
npm test
```

### Type Safety Validation

- **Backend**: Use TypeScript's strict mode for type checking
- **Frontend**: Generate equivalent classes and validate serialization
- **API Contracts**: Ensure backend types match API response schemas

---

## 📋 Best Practices

### Type Safety

1. **Avoid `any` types**: Use specific types whenever possible
2. **Use strict null checks**: Enable TypeScript's strict mode
3. **Interface segregation**: Keep interfaces focused on specific use cases
4. **Type composition**: Use intersection types (`&`) and union types (`|`) appropriately

### Documentation

1. **JSDoc comments**: Add descriptions for complex interfaces
2. **Usage examples**: Include code examples in comments
3. **Version compatibility**: Note breaking changes between versions

### Maintenance

1. **Regular updates**: Keep types synchronized with API changes
2. **Deprecation notices**: Mark deprecated types clearly
3. **Version management**: Use semantic versioning for breaking changes

---

## 🔄 Synchronization

### Backend ↔ Frontend

1. **API-first approach**: Define types based on actual API responses
2. **Automated generation**: Consider using tools like OpenAPI Generator
3. **Manual mapping**: Create equivalent Dart classes for Flutter apps
4. **Validation**: Use JSON Schema validation on both ends

### Cross-Platform Consistency

- **Naming conventions**: Maintain consistent naming across platforms
- **Data transformation**: Handle platform-specific serialization differences
- **Error handling**: Define consistent error response types

---

## 📚 Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
- [Shipzy Backend API](https://github.com/your-username/shipzy/tree/main/services/backend)
- [Shipzy User App](https://github.com/your-username/shipzy/tree/main/apps/user)

---

## 🤝 Contributing

1. **Type additions**: Add new types following the established patterns
2. **Documentation**: Update this README for new type categories
3. **Testing**: Ensure new types work across all consuming projects
4. **Reviews**: All type changes require review for breaking changes

### Guidelines

- **Breaking changes**: Require major version bump
- **New features**: Add to minor version
- **Bug fixes**: Patch version updates
- **Documentation**: Update README for new patterns

---

## 📄 License

This package is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.

---

## 👥 Team

Shared types maintained by the Shipzy development team.

**Questions?** Open an issue in the main repository.</contents>
</xai:function_call">The file packages/shared-types/README.md has been created. Here's the content of the new file:

     1|# 📦 Shipzy Shared Types
     2|
     3|[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6.svg)](https://www.typescriptlang.org/)
     4|[![License](https://img.shields.io/badge/License-MIT-green.svg)](../../LICENSE)
     5|
     6|> Shared TypeScript type definitions for the Shipzy hyperlocal delivery platform
     7|
     8|---
     9|
     10|## 📋 Overview
     11|
     12|The `@shipzy/shared-types` package provides centralized TypeScript type definitions used across the Shipzy monorepo. This ensures type safety and consistency between the backend API and frontend applications.
     13|
     14|### 📁 Package Contents
     15|
     16|```
     17|packages/shared-types/
     18|├── driver.types.ts      # Driver-related type definitions
     19|├── order.types.ts       # Order and delivery type definitions
     20|├── user.types.ts        # User authentication type definitions
     21|└── README.md           # This documentation
     22|```
     23|
     24|---
     25|
     26|## 🔧 Installation
     27|
     28|### For Backend (Node.js/TypeScript)
     29|
     30|```bash
     31|# From services/backend/
     32|npm install ../packages/shared-types
     33|```
     34|
     35|### For Frontend Applications (Flutter/Dart)
     36|
     37|Since this is a TypeScript package, frontend apps should generate their own type definitions from the API responses or use the types as reference for creating equivalent Dart classes.
     38|
     39|---
     40|
     41|## 📚 Type Definitions
     42|
     43|### User Types (`user.types.ts`)
     44|
     45|```typescript
     46|interface User {
     47|  id: string;
     48|  email: string;
     49|  name: string;
     50|  phone?: string;
     51|  role: "user" | "driver" | "admin";
     52|  createdAt: Date;
     53|  updatedAt?: Date;
     54|}
     55|
     56|interface CreateUserRequest {
     57|  email: string;
      name: string;
     58|  phone?: string;
     59|  password: string;
     60|}
     61|
     62|interface LoginRequest {
     63|  email: string;
      password: string;
     64|}
     65|
     66|interface AuthResponse {
     67|  user: User;
     68|  token: string;
     69|}
     70|```
     71|
     72|### Order Types (`order.types.ts`)
     73|
     74|```typescript
     75|interface Order {
     76|  id: string;
     77|  userId: string;
     78|  driverId?: string;
     79|  pickupLocation: {
     80|    lat: number;
      lng: number;
     81|    address: string;
     82|  };
     83|  dropoffLocation: {
     84|    lat: number;
      lng: number;
     85|    address: string;
     86|  };
     87|  status: "pending" | "assigned" | "in_transit" | "delivered" | "cancelled";
     88|  createdAt: Date;
      updatedAt?: Date;
     89|}
     90|
     91|interface CreateOrderRequest {
     92|  userId: string;
     93|  pickupLocation: {
     94|    lat: number;
     lng: number;
     95|    address: string;
     96|  };
     97|  dropoffLocation: {
     98|    lat: number;
     lng: number;
     99|    address: string;
     100|  };
     101|}
     102|
     103|type OrderStatus = Order["status"];
     104|```
     105|
     106|### Driver Types (`driver.types.ts`)
     107|
     108|```typescript
     109|interface Driver extends User {
     110|  vehicleType: string;
     111|  licenseNumber: string;
     112|  isAvailable: boolean;
     113|  currentLocation?: {
     114|    lat: number;
      lng: number;
     115|  };
     116|  rating?: number;
     117|}
     118|
     119|interface UpdateDriverAvailability {
     120|  isAvailable: boolean;
     121|  currentLocation?: {
     122|    lat: number;
     lng: number;
     123|  };
     124|}
     125|```
     126|
     127|---
     128|
     129|## 🚀 Usage
     130|
     131|### Backend Integration
     132|
     133|```typescript
     134|// services/backend/src/types/index.ts
     135|import { User, Order, Driver } from '@shipzy/shared-types';
     136|
     137|// Use types in your backend code
     138|interface ApiResponse<T> {
     139|  success: boolean;
     140|  data: T;
      message: string;
     141|}
     142|
     143|function getUserProfile(userId: string): Promise<ApiResponse<User>> {
     144|  // Implementation
     145|}
     146|```
     147|
     148|### Frontend Reference
     149|
     150|```dart
     151|// apps/user/lib/models/user.dart (equivalent Dart class)
     152|class User {
     153|  final String id;
     154|  final String email;
     155|  final String name;
     156|  final String? phone;
     157|  final UserRole role;
     158|  final DateTime createdAt;
     159|  final DateTime? updatedAt;
     160|
     161|  User({
     162|    required this.id,
     163|    required this.email,
     164|    required this.name,
     165|    this.phone,
     166|    required this.role,
     167|    required this.createdAt,
     168|    this.updatedAt,
     169|  });
     170|
     171|  // Factory constructor from JSON
     172|  factory User.fromJson(Map<String, dynamic> json) {
     173|    return User(
     174|      id: json['id'],
      email: json['email'],
     175|      name: json['name'],
     176|      phone: json['phone'],
     177|      role: UserRole.values[json['role']],
     178|      createdAt: DateTime.parse(json['createdAt']),
     179|      updatedAt: json['updatedAt'] != null
     180|          ? DateTime.parse(json['updatedAt'])
     181|          : null,
     182|    );
     183|  }
     184|}
     185|```
     186|
     187|---
     188|
     189|## 🛠️ Development
     190|
     191|### Adding New Types
     192|
     193|1. **Create or update type files** in the appropriate `.types.ts` file
     194|2. **Follow naming conventions**:
     195|   - Interfaces: `PascalCase`
     196|   - Properties: `camelCase`
     197|   - Enums: `PascalCase`
     198|3. **Add comprehensive JSDoc comments** for complex types
     199|4. **Export all new types** from their respective files
     200|
     201|### Type Organization Guidelines
     202|
     203|- **Domain-driven design**: Group types by business domain (user, order, driver)
     204|- **Consistent naming**: Use clear, descriptive names
     205|- **Optional properties**: Use `?:` for optional properties
     206|- **Union types**: Prefer union types over enums for simple cases
     207|- **Generic interfaces**: Use generics for reusable patterns
     208|
     209|### Example: Adding Payment Types
     210|
     211|```typescript
     212|// payment.types.ts
     213|export interface PaymentMethod {
     214|  id: string;
     215|  name: "card" | "upi" | "cod" | "wallet";
     216|  displayName: string;
     217|  isActive: boolean;
     218|}
     219|
     220|export interface PaymentTransaction {
     221|  id: string;
     222|  orderId: string;
     223|  amount: number;
     224|  currency: string;
     225|  method: PaymentMethod;
     226|  status: "pending" | "completed" | "failed" | "refunded";
     227|  createdAt: Date;
     228|  completedAt?: Date;
     229|}
     230|```
     231|
     232|---
     233|
     234|## 🧪 Testing
     235|
     236|```bash
     237|# Run type checking
     238|npx tsc --noEmit
     239|
     240|# Run tests (if any)
     241|npm test
     242|```
     243|
     244|### Type Safety Validation
     245|
     246|- **Backend**: Use TypeScript's strict mode for type checking
     247|- **Frontend**: Generate equivalent classes and validate serialization
     248|- **API Contracts**: Ensure backend types match API response schemas
     249|
     250|---
     251|
     252|## 📋 Best Practices
     253|
     254|### Type Safety
     255|
     256|1. **Avoid `any` types**: Use specific types whenever possible
     257|2. **Use strict null checks**: Enable TypeScript's strict mode
     258|3. **Interface segregation**: Keep interfaces focused on specific use cases
     259|4. **Type composition**: Use intersection types (`&`) and union types (`|`) appropriately
     258|
     259|### Documentation
     260|
     261|1. **JSDoc comments**: Add descriptions for complex interfaces
     262|2. **Usage examples**: Include code examples in comments
     263|3. **Version compatibility**: Note breaking changes between versions
     264|
     265|### Maintenance
     266|
     267|1. **Regular updates**: Keep types synchronized with API changes
     268|2. **Deprecation notices**: Mark deprecated types clearly
     269|3. **Version management**: Use semantic versioning for breaking changes
     270|
     271|---
     272|
     273|## 🔄 Synchronization
     274|
     275|### Backend ↔ Frontend
     276|
     277|1. **API-first approach**: Define types based on actual API responses
     278|2. **Automated generation**: Consider using tools like OpenAPI Generator
     279|3. **Manual mapping**: Create equivalent Dart classes for Flutter apps
     280|4. **Validation**: Use JSON Schema validation on both ends
     281|
     282|### Cross-Platform Consistency
     283|
     284|- **Naming conventions**: Maintain consistent naming across platforms
     285|- **Data transformation**: Handle platform-specific serialization differences
     286|- **Error handling**: Define consistent error response types
     287|
     288|---
     289|
     290|## 📚 Resources
     291|
     292|- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
     293|- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/declaration-files/do-s-and-don-ts.html)
     294|- [Shipzy Backend API](https://github.com/your-username/shipzy/tree/main/services/backend)
     295|- [Shipzy User App](https://github.com/your-username/shipzy/tree/main/apps/user)
     296|
     297|---
     298|
     299|## 🤝 Contributing
     300|
     301|1. **Type additions**: Add new types following the established patterns
     302|2. **Documentation**: Update this README for new type categories
     303|3. **Testing**: Ensure new types work across all consuming projects
     304|4. **Reviews**: All type changes require review for breaking changes
     305|
     306|### Guidelines
     307|
     308|- **Breaking changes**: Require major version bump
     309|- **New features**: Add to minor version
     310|- **Bug fixes**: Patch version updates
     311|- **Documentation**: Update README for new patterns
     312|
     313|---
     314|
     315|## 📄 License
     316|
     317|This package is licensed under the MIT License - see the [LICENSE](../../LICENSE) file for details.
     318|
     319|---
     320|
     321|## 👥 Team
     322|
     323|Shared types maintained by the Shipzy development team.
     324|
     325|**Questions?** Open an issue in the main repository.
