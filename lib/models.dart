class MenuItem {
  final String id;
  final String name;
  final String? nameEn;
  final String? description;
  final String? descriptionEn;
  final double price;
  final String? category;
  final String? image;
  final bool isDeal;
  final String? badge;
  final int sortOrder;

  const MenuItem({
    required this.id,
    required this.name,
    this.nameEn,
    this.description,
    this.descriptionEn,
    required this.price,
    this.category,
    this.image,
    this.isDeal = false,
    this.badge,
    this.sortOrder = 0,
  });

  factory MenuItem.fromJson(Map<String, dynamic> j) => MenuItem(
        id: j['id'] as String,
        name: j['name'] as String,
        nameEn: j['name_en'] as String?,
        description: j['description'] as String?,
        descriptionEn: j['description_en'] as String?,
        price: (j['price'] as num).toDouble(),
        category: j['category'] as String?,
        image: j['image'] as String?,
        isDeal: j['is_deal'] as bool? ?? false,
        badge: j['badge'] as String?,
        sortOrder: (j['sort_order'] as num?)?.toInt() ?? 0,
      );

  String localizedName(String lang) =>
      (lang == 'en' && (nameEn?.isNotEmpty ?? false)) ? nameEn! : name;

  String localizedDescription(String lang) =>
      (lang == 'en' && (descriptionEn?.isNotEmpty ?? false))
          ? descriptionEn!
          : (description ?? '');
}

class Location {
  final String id;
  final String name;
  final String address;
  final String? area;
  final String? phone;
  final double? lat;
  final double? lng;
  final int sortOrder;

  const Location({
    required this.id,
    required this.name,
    required this.address,
    this.area,
    this.phone,
    this.lat,
    this.lng,
    this.sortOrder = 0,
  });

  factory Location.fromJson(Map<String, dynamic> j) => Location(
        id: j['id'] as String,
        name: j['name'] as String,
        address: j['address'] as String,
        area: j['area'] as String?,
        phone: j['phone'] as String?,
        lat: (j['lat'] as num?)?.toDouble(),
        lng: (j['lng'] as num?)?.toDouble(),
        sortOrder: (j['sort_order'] as num?)?.toInt() ?? 0,
      );
}

class OrderLine {
  final String name;
  final double price;
  final int quantity;
  const OrderLine(this.name, this.price, this.quantity);

  factory OrderLine.fromJson(Map<String, dynamic> j) => OrderLine(
        j['name'] as String? ?? '',
        (j['price'] as num?)?.toDouble() ?? 0,
        (j['quantity'] as num?)?.toInt() ?? 0,
      );
}

class Order {
  final String id;
  final String orderNumber;
  final List<OrderLine> items;
  final double total;
  final String status;
  final String paymentStatus;
  final String? locationName;
  final DateTime? createdAt;

  const Order({
    required this.id,
    required this.orderNumber,
    required this.items,
    required this.total,
    required this.status,
    required this.paymentStatus,
    this.locationName,
    this.createdAt,
  });

  factory Order.fromJson(Map<String, dynamic> j) => Order(
        id: j['id'] as String,
        orderNumber: j['order_number'] as String,
        items: ((j['items'] as List?) ?? const [])
            .map((e) => OrderLine.fromJson(Map<String, dynamic>.from(e as Map)))
            .toList(),
        total: (j['total'] as num).toDouble(),
        status: j['status'] as String? ?? 'received',
        paymentStatus: j['payment_status'] as String? ?? 'pending',
        locationName: j['location_name'] as String?,
        createdAt: j['created_at'] == null
            ? null
            : DateTime.tryParse(j['created_at'] as String)?.toLocal(),
      );

  int get itemCount => items.fold(0, (s, i) => s + i.quantity);
}

class Review {
  final String id;
  final String description;
  final String author;
  final int rating;
  final String? locationName;
  final bool approved;

  const Review({
    required this.id,
    required this.description,
    required this.author,
    required this.rating,
    this.locationName,
    required this.approved,
  });

  factory Review.fromJson(Map<String, dynamic> j) => Review(
        id: j['id'] as String,
        description: j['description'] as String,
        author: j['author'] as String,
        rating: (j['rating'] as num).toInt(),
        locationName: j['location_name'] as String?,
        approved: j['approved'] as bool? ?? false,
      );
}

class CartItem {
  final MenuItem item;
  int quantity;
  CartItem(this.item, this.quantity);
}

class Profile {
  String name, phone, email, street, floor, area, zip, location;
  Profile({
    this.name = '',
    this.phone = '',
    this.email = '',
    this.street = '',
    this.floor = '',
    this.area = '',
    this.zip = '',
    this.location = '',
  });

  factory Profile.fromJson(Map<String, dynamic> j) => Profile(
        name: j['name'] as String? ?? '',
        phone: j['phone'] as String? ?? '',
        email: j['email'] as String? ?? '',
        street: j['street'] as String? ?? '',
        floor: j['floor'] as String? ?? '',
        area: j['area'] as String? ?? '',
        zip: j['zip'] as String? ?? '',
        location: j['location'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
        'street': street,
        'floor': floor,
        'area': area,
        'zip': zip,
        'location': location,
      };
}

const categories = <({String id, String label, String labelEn, String emoji})>[
  (id: 'kebab', label: 'Kebab', labelEn: 'Kebab', emoji: '🥙'),
  (id: 'durum', label: 'Durum', labelEn: 'Durum', emoji: '🌯'),
  (id: 'lahmacun', label: 'Lahmacun', labelEn: 'Lahmacun', emoji: '🫓'),
  (id: 'pedrata', label: 'Pedrata', labelEn: 'Pedrata', emoji: '🍲'),
  (id: 'plato', label: 'Plato', labelEn: 'Plates', emoji: '🍽️'),
  (id: 'boliviana', label: 'Comida Boliviana', labelEn: 'Bolivian Food', emoji: '🇧🇴'),
  (id: 'pollo', label: 'Pollo Frito', labelEn: 'Fried Chicken', emoji: '🍗'),
  (id: 'raciones', label: 'Raciones', labelEn: 'Sides', emoji: '🍟'),
];

String formatPrice(double p) => p == p.roundToDouble()
    ? '${p.toInt()}€'
    : '${p.toStringAsFixed(2).replaceAll('.', ',')}€';
