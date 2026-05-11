const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gilbrkaholcqjobjwuyl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdpbGJya2Fob2xjcWpvYmp3dXlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc5ODk1OTQsImV4cCI6MjA5MzU2NTU5NH0.bhVetuAV8iSZM8eiaX1n6evqSYWOlR5_ksX9lukkivU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDevices() {
    const { data, error } = await supabase.from('devices').select('*');
    if (error) {
        console.error('Error fetching devices:', error);
        return;
    }
    console.log('Registered Devices:');
    data.forEach(d => {
        console.log(`ID: ${d.id} | Model: ${d.model} | Last Seen: ${d.last_seen} | Pending: ${d.pending_command}`);
    });
}

checkDevices();
