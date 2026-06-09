import { useState, useEffect, useRef } from 'react';
import { createClient, RealtimeChannel } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import { Loader2, Clock, User } from 'lucide-react';
import Back from '@/components/back';
import { toast } from 'sonner';

// Supabase configuration placeholders - REPLACE WITH YOUR ACTUAL KEYS
const SUPABASE_URL = 'https://layonfapjyiupkjdswbj.supabase.co/';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxheW9uZmFwanlpdXBramRzd2JqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5MTY3MzgsImV4cCI6MjA5NjQ5MjczOH0.jSYHRPFYB5uev4GBV2bjyBhnMYvNybmiyWGjd9Rm92U';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Punch {
  id: string;
  punch_time: string; // ISO string format, e.g., "2023-10-27T10:00:00Z"
  user_id?: string;
  punch_type?: 0 | 1;
  // Add other relevant fields from your 'punches' table as needed
}

export default function TimetaagDashboard() {
  const [punches, setPunches] = useState<Punch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    fetchPunchDetails();

    // Set up real-time subscription
    channelRef.current = supabase
      .channel('public:punches')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'punches' }, (payload) => {
        console.log('Change received!', payload);
        if (payload.eventType === 'INSERT') {
          const newPunch = payload.new as Punch;
          setPunches((prevPunches) => {
            const updatedPunches = [...prevPunches, newPunch];
            return updatedPunches.sort((a, b) => new Date(b.punch_time).getTime() - new Date(a.punch_time).getTime());
          });
          toast.success('New punch added!');
        } else if (payload.eventType === 'UPDATE') {
          const updatedPunch = payload.new as Punch;
          setPunches((prevPunches) =>
            prevPunches.map((punch) => (punch.id === updatedPunch.id ? updatedPunch : punch))
          );
          toast.info('Punch updated!');
        } else if (payload.eventType === 'DELETE') {
          const deletedPunchId = payload.old.id;
          setPunches((prevPunches) =>
            prevPunches.filter((punch) => punch.id !== deletedPunchId)
          );
          toast.warning('Punch deleted!');
        }
      })
      .subscribe();

    // Cleanup subscription on component unmount
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  // Sort punches whenever the punches state changes, to ensure new real-time data is correctly positioned
  useEffect(() => {
    setPunches((prevPunches) => {
      return [...prevPunches].sort((a, b) => new Date(b.punch_time).getTime() - new Date(a.punch_time).getTime());
    });
  }, [punches.length]); // Trigger sort if the number of punches changes (e.g., insert/delete)



  const fetchPunchDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('punches')
        .select('*') // Select all columns by default
        .order('punch_time', { ascending: false }); // Order by most recent punches

      if (error) {
        throw error;
      }

      setPunches(data || []);
    } catch (err: any) {
      console.error('Error fetching punch details:', err.message);
      setError('Failed to fetch punch details: ' + err.message);
      toast.error('Failed to fetch punch details');
    } finally {
      setLoading(false);
    }
  };

  // Basic metrics calculation
  const totalPunches = punches.length;
  const recentPunches = punches.slice(0, 10); // Display top 10 recent punches

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ height: '100svh', display: 'flex', flexDirection: 'column' }}>
      <Back
        blurBG
        fixed
        title="Timetaag Dashboard"
        subtitle={`${totalPunches} Punches`}
        extra={
          <button
            onClick={fetchPunchDetails}
            disabled={loading}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '0.5rem',
              background: 'rgba(100, 100, 100, 0.1)',
              color: 'black',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : 'Refresh'}
          </button>
        }
      />

      <div style={{ paddingTop: '5rem', padding: '1rem', flex: 1, overflowY: 'auto' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
            <Loader2 className="animate-spin" size={32} />
          </div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '2rem', border:"solid", height:"100%", display:"flex", justifyContent:"center", alignItems:"center" }}>
            <p>{error}</p>
            <button onClick={fetchPunchDetails} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: 'red', color: 'white' }}>
              Try Again
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop:"5rem" }}>
            {/* Metrics Section */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <div style={{ background: 'rgba(100, 100, 100, 0.08)', padding: '1rem', borderRadius: '0.75rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <Clock size={24} color="mediumslateblue" />
                <span style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{totalPunches}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Total Punches</span>
              </div>
              {/* Add more metrics here as needed */}
            </div>

            {/* Recent Punches List */}
            <div style={{ background: 'rgba(100, 100, 100, 0.08)', padding: '1rem', borderRadius: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '1rem', borderBottom: '1px solid rgba(100, 100, 100, 0.1)', paddingBottom: '0.5rem' }}>Recent Punches</h3>
              {recentPunches.length === 0 ? (
                <p style={{ opacity: 0.7, textAlign: 'center' }}>No recent punches found.</p>
              ) : (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  {recentPunches.map((punch) => (
                    <li key={punch.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid rgba(100, 100, 100, 0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <User size={16} color="grey" />
                        <span style={{ fontWeight: '500' }}>{punch.user_id  || 'Unknown Employee'}</span>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>{new Date(punch.punch_time).toLocaleString()}</span>
                        {punch.punch_type && (
                          <span style={{ marginLeft: '0.5rem', padding: '0.2rem 0.6rem', borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 'bold', textTransform: 'uppercase', background: punch.punch_type === 1 ? 'rgba(0, 180, 100, 0.15)' : 'rgba(220, 60, 60, 0.15)', color: punch.punch_type === 1 ? 'rgb(0, 140, 80)' : 'crimson' }}>
                            {punch.punch_type===1?"IN":"OUT"}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}