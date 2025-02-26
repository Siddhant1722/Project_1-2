# Health & Socioeconomic Factors Dashboard

An interactive D3.js dashboard exploring the relationships between socioeconomic factors and health outcomes across US counties.

## Project Overview

This dashboard visualizes data from the US Heart and Stroke Atlas to help users explore the connections between economic indicators (income, poverty, education) and health metrics (stroke rates, heart disease, blood pressure, cholesterol).

## Features

- **Interactive Scatter Plot**: Explore correlations between socioeconomic factors and health outcomes
- **Choropleth Map**: View geographic distribution of health and economic metrics
- **Distribution Histogram**: Understand the distribution of health outcomes
- **Urban/Rural Comparison**: Compare health metrics across different area types
- **County Details Panel**: View detailed information for selected counties
- **Dynamic Filtering**: Filter by area type (urban, rural, etc.)

## Setup Instructions

1. Clone this repository to your local machine
2. Ensure you have the data file (`national_health_data_2024.csv`) in the root directory
3. Open `index.html` in a web browser to view the dashboard locally

## Deployment

This project can be deployed using any static site hosting service:

### Deploying with Vercel

1. Create a Vercel account at [vercel.com](https://vercel.com) if you don't have one
2. Install the Vercel CLI: `npm install -g vercel`
3. Navigate to your project directory in the terminal
4. Run `vercel login` and follow the authentication steps
5. Deploy with `vercel`
6. Follow the prompts and your site will be deployed

## File Structure

- `index.html` - Main HTML structure
- `styles.css` - CSS styling for the dashboard
- `script.js` - JavaScript code that powers the interactive features
- `national_health_data_2024.csv` - Dataset (add this file to your project)

## Technical Details

- **Libraries Used**:
  - D3.js v7 for data visualization
  - TopoJSON for map visualization
  - D3-legend for legends

- **Browser Compatibility**: 
  This dashboard is optimized for Chrome browser

- **Screen Size**:
  Designed for laptop/desktop screens with minimum width of 1200px

## Data Source

Data comes from the US Heart and Stroke Atlas from the CDC. The dataset includes:
- Socioeconomic indicators (income, poverty, education)
- Health metrics (stroke rate, blood pressure, heart disease, cholesterol)
- Environmental factors (air quality, park access)
- Behavioral factors (physical inactivity, smoking)
- Demographics (elderly population, urban/rural classification)

## Development Notes

The color schemes were carefully selected using ColorBrewer palettes:
- Health metrics: Red-Yellow-Blue (RdYlBu) diverging scale
- Income: Blues sequential scale
- Poverty: Yellow-Orange-Red (YlOrRd) sequential scale
- Education: Yellow-Green-Blue (YlGnBu) sequential scale

## License

The code in this project is available for educational purposes.

## Contact

For any questions, please contact [your contact information].
