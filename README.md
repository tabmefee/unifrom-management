# Uniform Tracker

A modern web application for managing university uniform inventory built with React and Supabase.

## Features

- **Dashboard**: Overview of inventory statistics
- **Stock Management**: Receive and track uniform deliveries
- **Student Management**: Search and manage student records
- **Issue Tracking**: Issue uniforms to students with detailed records
- **Stock Balance**: Real-time inventory levels with low stock alerts
- **History**: Complete transaction history for deliveries and issues

## Tech Stack

- **Frontend**: React 19, Tailwind CSS, ShadCN UI
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Deployment**: Vercel

## Setup Instructions

### 1. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the SQL schema in your Supabase SQL editor:

```sql
-- Create uniform_items table
CREATE TABLE uniform_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  has_size BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create students table
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_number VARCHAR UNIQUE NOT NULL,
  roll_number VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  class_year VARCHAR NOT NULL,
  phone VARCHAR,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create stock_receipts table
CREATE TABLE stock_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number VARCHAR NOT NULL,
  vendor_name VARCHAR NOT NULL,
  bill_date DATE NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  items JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create issue_receipts table
CREATE TABLE issue_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  student_name VARCHAR NOT NULL,
  registration_number VARCHAR NOT NULL,
  roll_number VARCHAR NOT NULL,
  items JSONB NOT NULL,
  issued_date DATE NOT NULL,
  issued_by VARCHAR NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default uniform items
INSERT INTO uniform_items (name, has_size) VALUES
('Shirt', true),
('Pants', true),
('Blazer', true),
('Shoes', true),
('Socks', true),
('Tie', false),
('Belt', true),
('Badge', false);

-- Enable Row Level Security (RLS)
ALTER TABLE uniform_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_receipts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public read access on uniform_items" ON uniform_items
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on students" ON students
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on stock_receipts" ON stock_receipts
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access on issue_receipts" ON issue_receipts
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert on students" ON students
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on stock_receipts" ON stock_receipts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert on issue_receipts" ON issue_receipts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on students" ON students
  FOR UPDATE USING (true);
```

### 2. Local Development

1. Clone the repository
2. Install dependencies:
   ```bash
   cd frontend
   npm install --legacy-peer-deps
   ```

3. Create environment file:
   ```bash
   cp env.example .env.local
   ```

4. Add your Supabase anon key to `.env.local`:
   ```
   REACT_APP_SUPABASE_KEY=your_supabase_anon_key_here
   ```

5. Start the development server:
   ```bash
   npm start
   ```

### 3. Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variable in Vercel dashboard:
   - `REACT_APP_SUPABASE_KEY`: Your Supabase anon key
4. Deploy!

## Environment Variables

- `REACT_APP_SUPABASE_KEY`: Your Supabase anonymous key

## Project Structure

```
uniform/
├── frontend/
│   ├── src/
│   │   ├── components/ui/     # ShadCN UI components
│   │   ├── lib/
│   │   │   ├── supabase.js    # Supabase client configuration
│   │   │   └── utils.js       # Utility functions
│   │   └── App.js             # Main application
│   ├── package.json
│   └── env.example
├── vercel.json                # Vercel configuration
└── README.md
```

## Features Overview

### Dashboard
- Real-time statistics (total items, students, receipts, issues)
- Low stock alerts
- Quick navigation to all features

### Stock Management
- Receive new uniform deliveries
- Track vendor information and bill details
- Support for multiple items per delivery

### Student Management
- Search students by name, registration, or roll number
- Auto-complete suggestions
- Create new student records on-the-fly

### Issue Tracking
- Issue uniforms to students
- Track who issued the items
- Detailed item and quantity tracking

### Stock Balance
- Real-time inventory calculations
- Filter by stock levels (all, low stock, out of stock)
- Visual indicators for stock status

### History
- Complete transaction history
- Separate views for deliveries and issues
- Chronological ordering

## License

MIT License
