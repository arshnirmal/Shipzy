import '../models/orders/order.dart';
import 'dio/api_client.dart';

class OrdersRepository {
  OrdersRepository(this._apiClient);
  final ApiClient _apiClient;

  Future<List<Order>> getOrders({int page = 1, int limit = 20, String? status}) async {
    final queryParams = {'page': page.toString(), 'limit': limit.toString(), if (status != null) 'status': status};

    try {
      final response = await _apiClient.get('/orders', queryParameters: queryParams);

      if (response.statusCode == 200) {
        final data = response.data;
        final List<dynamic> ordersJson = data['data'];
        return ordersJson.map((json) => Order.fromJson(json as Map<String, dynamic>)).toList();
      } else {
        throw Exception('Failed to load orders');
      }
    } catch (e) {
      rethrow;
    }
  }
}
