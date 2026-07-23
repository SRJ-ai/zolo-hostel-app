import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Building2, LogOut, Users, BedDouble, AlertCircle } from 'lucide-react';

type DashboardData = {
  hostel: any;
  floors: any[];
  rooms: any[];
  beds: any[];
};

export function Dashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Fetch hostel
      const { data: hostel, error: hostelError } = await supabase
        .from('hostels')
        .select('*')
        .eq('owner_id', user.id)
        .single();

      if (hostelError && hostelError.code !== 'PGRST116') {
        throw hostelError;
      }

      if (!hostel) {
        // No hostel configured, redirect to setup
        navigate('/setup');
        return;
      }

      // Fetch floors, rooms, beds
      const { data: floors } = await supabase.from('floors').select('*').eq('hostel_id', hostel.id).order('floor_number');
      const { data: rooms } = await supabase.from('rooms').select('*, floors!inner(hostel_id)').eq('floors.hostel_id', hostel.id);
      const { data: beds } = await supabase.from('beds').select('*, rooms!inner(floors!inner(hostel_id))').eq('rooms.floors.hostel_id', hostel.id);

      setData({
        hostel,
        floors: floors || [],
        rooms: rooms || [],
        beds: beds || []
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!data) return null;

  const totalBeds = data.beds.length;
  const occupiedBeds = data.beds.filter(b => b.status === 'occupied').length;
  const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="glass border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-6 h-6 text-primary" />
              <span className="text-xl font-bold">{data.hostel.name}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-text-muted hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <BedDouble className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Total Beds</p>
                <h3 className="text-2xl font-bold">{totalBeds}</h3>
              </div>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Occupied</p>
                <h3 className="text-2xl font-bold">{occupiedBeds}</h3>
              </div>
            </div>
          </div>
          <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <AlertCircle className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-text-muted">Occupancy Rate</p>
                <h3 className="text-2xl font-bold">{occupancyRate}%</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Floors and Rooms */}
        <div className="space-y-8">
          {data.floors.map(floor => (
            <div key={floor.id} className="glass p-6 rounded-2xl">
              <h2 className="text-xl font-bold mb-4">{floor.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.rooms.filter(r => r.floor_id === floor.id).map(room => {
                  const roomBeds = data.beds.filter(b => b.room_id === room.id);
                  const roomOccupied = roomBeds.filter(b => b.status === 'occupied').length;
                  return (
                    <div key={room.id} className="bg-surface-hover/30 p-4 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-semibold text-lg">Room {room.room_number}</h4>
                        <span className="text-xs px-2 py-1 bg-surface rounded-full text-text-muted">
                          {room.capacity} Sharing
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-text-muted mb-4">
                        <Users className="w-4 h-4" /> {roomOccupied} / {room.capacity} Occupied
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {roomBeds.map(bed => (
                          <div 
                            key={bed.id}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex-1 text-center ${
                              bed.status === 'available' 
                                ? 'bg-green-500/10 border-green-500/30 text-green-400'
                                : 'bg-red-500/10 border-red-500/30 text-red-400'
                            }`}
                          >
                            {bed.bed_number}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
