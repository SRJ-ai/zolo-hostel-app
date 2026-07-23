import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Check, Building, Layers, DoorOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';

type RoomConfig = { capacity: number; roomNumber: string };
type FloorConfig = { floorNumber: number; rooms: RoomConfig[] };

export function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  const [hostelName, setHostelName] = useState('');
  const [numFloors, setNumFloors] = useState(1);
  const [floors, setFloors] = useState<FloorConfig[]>([]);

  // Initialize floors when moving from step 1 to 2
  const handleStep1Next = () => {
    const initialFloors: FloorConfig[] = Array.from({ length: numFloors }, (_, i) => ({
      floorNumber: i + 1,
      rooms: [{ capacity: 3, roomNumber: `${i + 1}01` }] // Default 1 room per floor
    }));
    setFloors(initialFloors);
    setStep(2);
  };

  const updateFloorRoomsCount = (floorIndex: number, count: number) => {
    const newFloors = [...floors];
    const currentRooms = newFloors[floorIndex].rooms;
    
    if (count > currentRooms.length) {
      // Add more rooms
      const toAdd = count - currentRooms.length;
      for (let i = 0; i < toAdd; i++) {
        currentRooms.push({ 
          capacity: 3, 
          roomNumber: `${newFloors[floorIndex].floorNumber}${String(currentRooms.length + 1).padStart(2, '0')}` 
        });
      }
    } else if (count < currentRooms.length) {
      // Remove rooms
      currentRooms.length = count;
    }
    
    setFloors(newFloors);
  };

  const updateRoomCapacity = (floorIndex: number, roomIndex: number, capacity: number) => {
    const newFloors = [...floors];
    newFloors[floorIndex].rooms[roomIndex].capacity = capacity;
    setFloors(newFloors);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Create Hostel
      const { data: hostelData, error: hostelError } = await supabase
        .from('hostels')
        .insert([{ name: hostelName, owner_id: user.id }])
        .select()
        .single();
      
      if (hostelError) throw hostelError;

      // 2. Create Floors and Rooms
      for (const floor of floors) {
        const { data: floorData, error: floorError } = await supabase
          .from('floors')
          .insert([{ hostel_id: hostelData.id, floor_number: floor.floorNumber, name: `Floor ${floor.floorNumber}` }])
          .select()
          .single();
        
        if (floorError) throw floorError;

        const roomsToInsert = floor.rooms.map(r => ({
          floor_id: floorData.id,
          room_number: r.roomNumber,
          capacity: r.capacity
        }));

        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .insert(roomsToInsert)
          .select();
        
        if (roomsError) throw roomsError;

        // 3. Create Beds for each room
        for (let i = 0; i < roomsData.length; i++) {
          const room = roomsData[i];
          const bedsToInsert = Array.from({ length: room.capacity }, (_, j) => ({
            room_id: room.id,
            bed_number: `${room.room_number}-${String.fromCharCode(65 + j)}`, // e.g. 101-A, 101-B
            status: 'available'
          }));

          await supabase.from('beds').insert(bedsToInsert);
        }
      }

      alert('Setup completed successfully!');
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      alert('Error saving setup: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Hostel Setup</h1>
          <p className="text-text-muted">Configure your property structure</p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center mb-12">
          {[1, 2, 3].map((s) => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= s ? 'bg-primary text-white' : 'bg-surface-hover text-text-muted'}`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`flex-1 h-1 mx-2 rounded ${step > s ? 'bg-primary' : 'bg-surface-hover'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="glass p-8 rounded-2xl">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Building className="w-5 h-5 text-primary" />
                Basic Details
              </h2>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Hostel Name</label>
                <input
                  type="text"
                  value={hostelName}
                  onChange={(e) => setHostelName(e.target.value)}
                  className="w-full bg-surface-hover/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="e.g. Sunrise Coliving"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">Number of Floors</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={numFloors}
                  onChange={(e) => setNumFloors(parseInt(e.target.value) || 1)}
                  className="w-full bg-surface-hover/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex justify-end pt-4">
                <button
                  onClick={handleStep1Next}
                  disabled={!hostelName}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
                >
                  Next Step <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                Rooms per Floor
              </h2>
              <div className="space-y-4">
                {floors.map((floor, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-surface-hover/30 rounded-lg border border-white/5">
                    <span className="font-medium">Floor {floor.floorNumber}</span>
                    <div className="flex items-center gap-4">
                      <label className="text-sm text-text-muted">Number of rooms:</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={floor.rooms.length}
                        onChange={(e) => updateFloorRoomsCount(idx, parseInt(e.target.value) || 1)}
                        className="w-20 bg-surface border border-white/10 rounded-md px-3 py-1.5 text-center text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="bg-surface-hover hover:bg-surface text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  Configure Capacities <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-primary" />
                Room Capacities
              </h2>
              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {floors.map((floor, fIdx) => (
                  <div key={fIdx} className="space-y-4">
                    <h3 className="font-semibold text-lg text-primary-dark border-b border-white/10 pb-2">Floor {floor.floorNumber}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {floor.rooms.map((room, rIdx) => (
                        <div key={rIdx} className="flex items-center justify-between p-3 bg-surface-hover/30 rounded-lg border border-white/5">
                          <span className="font-medium">Room {room.roomNumber}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-text-muted">Sharing:</span>
                            <select
                              value={room.capacity}
                              onChange={(e) => updateRoomCapacity(fIdx, rIdx, parseInt(e.target.value))}
                              className="bg-surface border border-white/10 rounded-md px-2 py-1 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                              <option value={1}>1-Sharing</option>
                              <option value={2}>2-Sharing</option>
                              <option value={3}>3-Sharing</option>
                              <option value={4}>4-Sharing</option>
                              <option value={5}>5-Sharing</option>
                              <option value={6}>6-Sharing</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-4 border-t border-white/10">
                <button
                  onClick={() => setStep(2)}
                  className="bg-surface-hover hover:bg-surface text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors border border-white/10"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
                <button
                  onClick={handleFinish}
                  disabled={loading}
                  className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Finish Setup'} <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
