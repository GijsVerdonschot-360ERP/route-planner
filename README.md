# Route Planner

A React application for visualizing and optimizing delivery routes based on CSV data.

## Features

- Upload and visualize route data from CSV files
- View routes on an interactive map
- Filter routes by date
- View statistics for each route (distance, time, number of stops)
- Compare original and optimized routes
- Calculate distance and time savings

## CSV Format

The application expects CSV files with the following format:

```
Abonnement;Benodigde tijd (uren);Externe ID;Startdatum;Toegewezen aan;Abonnement/Afleveradres
K-A/ABO02101 - Martens keramiek B.V.;1,25;__import__.zungo_scheme_line_3613;2025-02-12 03:45:00;Hans Heeren;Martens keramiek B.V., Dinteloord, Rondom 125
```

Required columns:
- `Abonnement`: The name of the subscription/customer
- `Benodigde tijd (uren)`: Required time in hours (uses comma as decimal separator)
- `Startdatum`: The date of the visit
- `Abonnement/Afleveradres`: The delivery address in format "Company name, City, Street Address"

Optional columns:
- `Externe ID`: External ID for the location
- `Toegewezen aan`: Person assigned to the task
- `Begin datum-tijd`: Start date and time (for optimized routes)
- `Eind datum-tijd`: End date and time (for optimized routes)

## How to Use

1. Upload your original route data CSV file using the "Choose File" button under "Original Route"
2. Optionally upload an optimized route CSV file using the "Choose File" button under "Optimized Route"
3. Use the date selector to filter routes by specific dates
4. View route statistics in the control panel
5. Click "Compare Routes" to see a comparison between original and optimized routes

## Technical Details

The application uses:
- React for the UI
- TypeScript for type safety
- Leaflet for map visualization
- PapaParse for CSV parsing
- Nominatim API for geocoding addresses

## Development

To set up the development environment:

1. Clone the repository
2. Install dependencies: `npm install`
3. Start the development server: `npm start`

## Building for Production

To build the application for production:

```
npm run build
```

This will create a `build` folder with the optimized production build.

## Notes

- The application caches geocoded addresses to minimize API calls
- Nominatim API has usage limits, so large datasets may require multiple attempts
- Dutch address format is supported with comma as decimal separator 