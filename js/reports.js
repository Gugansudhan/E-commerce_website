const API_KEY = "AIzaSyCM5Csk-fsX5pkykvImbE8Ma37op-J3z9w"; 
const PROJECT_ID = "ecommerce-43f8f";  
const COLLECTION_ID = "orders"; // Ensure the collection name is correct

// Function to fetch all orders from Firestore
async function fetchOrders() {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${COLLECTION_ID}?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.documents) {
            return data.documents;
        } else {
            console.error('No documents found');
            return [];
        }
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

// Function to download all orders as CSV
async function downloadAllOrders() {
    const orders = await fetchOrders();
    console.log('Fetched Orders:', orders); // Log the orders to see the raw data

    if (orders.length === 0) {
        alert('No orders found.');
        return;
    }

    const csvData = [];

    // Process each order
    orders.forEach(order => {
        const orderId = order.fields.orderId?.stringValue || 'N/A';
        const userId = order.fields.userId?.stringValue || 'N/A';
        const orderDate = order.fields.date?.stringValue || 'N/A';
        const address = order.fields.address?.stringValue || 'N/A';
        const paymentMethod = order.fields.paymentMethod?.stringValue || 'N/A';

        // Extract items array
        const items = order.fields.items?.arrayValue?.values || [];

        items.forEach(item => {
            const itemName = item.mapValue.fields.name?.stringValue || 'N/A';
            const itemPrice = item.mapValue.fields.price?.doubleValue || 0;
            const itemQuantity = item.mapValue.fields.quantity?.integerValue || 0;
            const itemDescription = item.mapValue.fields.description?.stringValue || 'N/A';
            const itemImageUrl = item.mapValue.fields.imageUrl?.stringValue || 'N/A';
            const productId = item.mapValue.fields.productId?.stringValue || 'N/A';

            // Add each item row to CSV data
            csvData.push([
                orderId,
                userId,
                orderDate,
                address,
                paymentMethod,
                itemName,
                itemPrice,
                itemQuantity,
                itemDescription,
                itemImageUrl,
                productId
            ]);
        });
    });

    // Add headers for CSV file
    csvData.unshift(['Order ID', 'Customer ID', 'Order Date', 'Address', 'Payment Method', 'Item Name', 'Price', 'Quantity', 'Description', 'Image URL', 'Product ID']);

    // Download the CSV file
    downloadCSV(csvData, 'all-orders.csv');
}

// Function to download the top 10 orders based on quantity purchased, filtered by date
async function downloadTop10Orders(fromDate, toDate) {
    const orders = await fetchOrders();
    
    if (orders.length === 0) {
        alert('No orders found.');
        return;
    }

    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date?.stringValue);
        return orderDate >= new Date(fromDate) && orderDate <= new Date(toDate);
    });

    const csvData = [];

    // Sort by total quantity purchased
    filteredOrders.sort((a, b) => {
        const totalQuantityA = a.fields.items.arrayValue.values
            .reduce((acc, item) => acc + (item.mapValue.fields.quantity?.integerValue || 0), 0);
        const totalQuantityB = b.fields.items.arrayValue.values
            .reduce((acc, item) => acc + (item.mapValue.fields.quantity?.integerValue || 0), 0);
        return totalQuantityB - totalQuantityA; // Descending order
    }).slice(0, 10) // Top 10 orders
    .forEach(order => {
        const orderId = order.fields.orderId?.stringValue || 'N/A';
        const userId = order.fields.userId?.stringValue || 'N/A';
        const orderDate = order.fields.date?.stringValue || 'N/A';
        const address = order.fields.address?.stringValue || 'N/A';
        const paymentMethod = order.fields.paymentMethod?.stringValue || 'N/A';

        // Extract items array
        const items = order.fields.items?.arrayValue?.values || [];

        items.forEach(item => {
            const itemName = item.mapValue.fields.name?.stringValue || 'N/A';
            const itemPrice = item.mapValue.fields.price?.doubleValue || 0;
            const itemQuantity = item.mapValue.fields.quantity?.integerValue || 0;
            const itemDescription = item.mapValue.fields.description?.stringValue || 'N/A';
            const itemImageUrl = item.mapValue.fields.imageUrl?.stringValue || 'N/A';
            const productId = item.mapValue.fields.productId?.stringValue || 'N/A';

            // Add each item row to CSV data
            csvData.push([
                orderId,
                userId,
                orderDate,
                address,
                paymentMethod,
                itemName,
                itemPrice,
                itemQuantity,
                itemDescription,
                itemImageUrl,
                productId
            ]);
        });
    });

    // Add headers for CSV file
    csvData.unshift(['Order ID', 'Customer ID', 'Order Date', 'Address', 'Payment Method', 'Item Name', 'Price', 'Quantity', 'Description', 'Image URL', 'Product ID']);

    // Download the CSV file
    downloadCSV(csvData, 'top-10-orders.csv');
}

// Function to download Cash Purchase Reports filtered by date
async function downloadCashPurchaseReport(fromDate, toDate) {
    const orders = await fetchOrders();

    if (orders.length === 0) {
        alert('No orders found.');
        return;
    }

    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date?.stringValue);
        return orderDate >= new Date(fromDate) && orderDate <= new Date(toDate)
            && order.fields.paymentMethod?.stringValue === 'cash-on-delivery';
    });

    const csvData = [];

    filteredOrders.forEach(order => {
        const orderId = order.fields.orderId?.stringValue || 'N/A';
        const userId = order.fields.userId?.stringValue || 'N/A';
        const orderDate = order.fields.date?.stringValue || 'N/A';
        const address = order.fields.address?.stringValue || 'N/A';
        const paymentMethod = order.fields.paymentMethod?.stringValue || 'N/A';

        // Extract items array
        const items = order.fields.items?.arrayValue?.values || [];

        items.forEach(item => {
            const itemName = item.mapValue.fields.name?.stringValue || 'N/A';
            const itemPrice = item.mapValue.fields.price?.doubleValue || 0;
            const itemQuantity = item.mapValue.fields.quantity?.integerValue || 0;
            const itemDescription = item.mapValue.fields.description?.stringValue || 'N/A';
            const itemImageUrl = item.mapValue.fields.imageUrl?.stringValue || 'N/A';
            const productId = item.mapValue.fields.productId?.stringValue || 'N/A';

            // Add each item row to CSV data
            csvData.push([
                orderId,
                userId,
                orderDate,
                address,
                paymentMethod,
                itemName,
                itemPrice,
                itemQuantity,
                itemDescription,
                itemImageUrl,
                productId
            ]);
        });
    });

    // Add headers for CSV file
    csvData.unshift(['Order ID', 'Customer ID', 'Order Date', 'Address', 'Payment Method', 'Item Name', 'Price', 'Quantity', 'Description', 'Image URL', 'Product ID']);

    // Download the CSV file
    downloadCSV(csvData, 'cash-purchase-report.csv');
}

// Function to download Credit Purchase Reports filtered by date
async function downloadCreditPurchaseReport(fromDate, toDate) {
    const orders = await fetchOrders();

    if (orders.length === 0) {
        alert('No orders found.');
        return;
    }

    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.fields.date?.stringValue);
        return orderDate >= new Date(fromDate) && orderDate <= new Date(toDate)
            && order.fields.paymentMethod?.stringValue === 'credit-card';
    });

    const csvData = [];

    filteredOrders.forEach(order => {
        const orderId = order.fields.orderId?.stringValue || 'N/A';
        const userId = order.fields.userId?.stringValue || 'N/A';
        const orderDate = order.fields.date?.stringValue || 'N/A';
        const address = order.fields.address?.stringValue || 'N/A';
        const paymentMethod = order.fields.paymentMethod?.stringValue || 'N/A';

        // Extract items array
        const items = order.fields.items?.arrayValue?.values || [];

        items.forEach(item => {
            const itemName = item.mapValue.fields.name?.stringValue || 'N/A';
            const itemPrice = item.mapValue.fields.price?.doubleValue || 0;
            const itemQuantity = item.mapValue.fields.quantity?.integerValue || 0;
            const itemDescription = item.mapValue.fields.description?.stringValue || 'N/A';
            const itemImageUrl = item.mapValue.fields.imageUrl?.stringValue || 'N/A';
            const productId = item.mapValue.fields.productId?.stringValue || 'N/A';

            // Add each item row to CSV data
            csvData.push([
                orderId,
                userId,
                orderDate,
                address,
                paymentMethod,
                itemName,
                itemPrice,
                itemQuantity,
                itemDescription,
                itemImageUrl,
                productId
            ]);
        });
    });

    // Add headers for CSV file
    csvData.unshift(['Order ID', 'Customer ID', 'Order Date', 'Address', 'Payment Method', 'Item Name', 'Price', 'Quantity', 'Description', 'Image URL', 'Product ID']);

    // Download the CSV file
    downloadCSV(csvData, 'credit-purchase-report.csv');
}

// Helper function to download CSV file
function downloadCSV(csvData, filename) {
    const csvContent = csvData.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Example usage: Call these functions on button clicks or other events
// document.getElementById('download-all-orders').addEventListener('click', downloadAllOrders);
// document.getElementById('download-top-10-orders').addEventListener('click', () => downloadTop10Orders('2023-01-01', '2023-12-31'));
// document.getElementById('download-cash-purchase-report').addEventListener('click', () => downloadCashPurchaseReport('2023-01-01', '2023-12-31'));
// document.getElementById('download-credit-purchase-report').addEventListener('click', () => downloadCreditPurchaseReport('2023-01-01', '2023-12-31'));

