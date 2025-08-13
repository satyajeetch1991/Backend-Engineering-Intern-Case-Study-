# Bynry Backend Developer Intern Case Study

## Overview

This repository contains a complete implementation of a backend system for managing products, inventory, and warehouses using Node.js, Express.js, and MongoDB. The project addresses the requirements for the Bynry Backend Developer Intern role case study.

## Project Structure

```
bynry-backend-case-study/
├── README.md                     # This file
├── part1_code_review.md          # Code review analysis and fixes
├── part1_fixed_code.js           # Corrected Express/MongoDB API code
├── part2_db_schema.js            # Mongoose schema definitions
├── part2_erd.dbdiagram           # ER diagram in dbdiagram.io format
├── part2_erd.png                 # Exported ER diagram image
├── part3_api.js                  # Low-stock alerts API implementation
├── part3_sample_response.json    # Example API output
├── package.json                  # Node.js dependencies
└── server.js                     # Main server file
```

## Technology Stack

- **Backend**: Node.js + Express.js
- **Database**: MongoDB + Mongoose
- **Validation**: Joi + Express-validator
- **Security**: Helmet + CORS + Rate limiting
- **Environment**: dotenv for configuration

## Assumptions Made

### Business Logic Assumptions
1. **Low Stock Thresholds**: 
   - Electronics: 10 units
   - Clothing: 25 units
   - Food: 50 units
   - Default: 20 units

2. **Recent Sales Activity**: Products with sales in the last 30 days are considered active

3. **Stockout Calculation**: Based on average daily sales over the last 7 days

4. **Supplier Priority**: Primary supplier is used for reordering alerts

### Technical Assumptions
1. **Authentication**: Not implemented (focus on core business logic)
2. **Pagination**: Default limit of 100 alerts per request
3. **Error Handling**: Standard HTTP status codes with descriptive messages
4. **Logging**: Console logging for development (production would use proper logging service)

## Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

## Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd bynry-backend-case-study
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/bynry_case_study
NODE_ENV=development
```

### 4. Start MongoDB
Ensure MongoDB is running on your system or update the connection string in `.env`

### 5. Run the Application
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

The server will start on `http://localhost:3000`

## API Endpoints

### Core Endpoints
- `POST /api/products` - Add new product
- `PUT /api/inventory/:product_id` - Update inventory
- `GET /api/companies/:company_id/alerts/low-stock` - Get low stock alerts

### Health Check
- `GET /health` - Server health status

## Database Collections

The system uses the following MongoDB collections:
- `companies` - Company information
- `warehouses` - Warehouse details
- `products` - Product catalog
- `inventory` - Current stock levels
- `inventory_logs` - Inventory change history
- `suppliers` - Supplier information
- `product_suppliers` - Product-supplier relationships
- `bundle_items` - Bundle product components

## ER Diagram

The database schema is documented in `part2_erd.dbdiagram` and can be viewed at [dbdiagram.io](https://dbdiagram.io) by importing the file.

## Testing

Run the test suite:
```bash
npm test
```

## Production Considerations

1. **Security**: Implement proper authentication and authorization
2. **Logging**: Use structured logging (Winston, Bunyan)
3. **Monitoring**: Add health checks and metrics
4. **Caching**: Implement Redis for frequently accessed data
5. **Rate Limiting**: Configure appropriate limits for production traffic
6. **Error Tracking**: Integrate with error tracking services

## Contributing

This is a case study submission. For questions or clarifications, please refer to the case study requirements.

## License

MIT License - See LICENSE file for details.


