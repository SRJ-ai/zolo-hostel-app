-- Create Hostels table
CREATE TABLE public.hostels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Floors table
CREATE TABLE public.floors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hostel_id UUID NOT NULL REFERENCES public.hostels(id) ON DELETE CASCADE,
    floor_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Rooms table
CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    floor_id UUID NOT NULL REFERENCES public.floors(id) ON DELETE CASCADE,
    room_number TEXT NOT NULL,
    capacity INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Beds table
CREATE TABLE public.beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    bed_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'occupied', 'maintenance')),
    occupant_id UUID NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.hostels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.floors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beds ENABLE ROW LEVEL SECURITY;

-- Policies for Hostels
CREATE POLICY "Owners can manage their own hostels" ON public.hostels
    FOR ALL
    USING (auth.uid() = owner_id);

-- Policies for Floors
CREATE POLICY "Owners can manage floors in their hostels" ON public.floors
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.hostels
            WHERE hostels.id = floors.hostel_id
            AND hostels.owner_id = auth.uid()
        )
    );

-- Policies for Rooms
CREATE POLICY "Owners can manage rooms in their hostels" ON public.rooms
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.floors
            JOIN public.hostels ON hostels.id = floors.hostel_id
            WHERE floors.id = rooms.floor_id
            AND hostels.owner_id = auth.uid()
        )
    );

-- Policies for Beds
CREATE POLICY "Owners can manage beds in their hostels" ON public.beds
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.rooms
            JOIN public.floors ON floors.id = rooms.floor_id
            JOIN public.hostels ON hostels.id = floors.hostel_id
            WHERE rooms.id = beds.room_id
            AND hostels.owner_id = auth.uid()
        )
    );
