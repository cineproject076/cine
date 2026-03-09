const supabase = require('../config/supabaseClient');

// ✅ STATUS ENGINE: Enforce Level 2 Mandatory Fields
const calculateStatus = (t) => {
    const fields = ['primary_image', 'height_cm', 'body_type', 'screen_persona', 'languages', 'areas_of_interest'];
    const isComplete = fields.every(f => t[f] && (Array.isArray(t[f]) ? t[f].length > 0 : true));
    return isComplete ? 'active' : 'incomplete';
};

// 1. ADD TALENT MANUALLY
exports.addTalentManual = async (req, res) => {
    try {
        const talentData = { ...req.body, created_by: req.user.id };
        talentData.status = calculateStatus(talentData);

        const { data, error } = await supabase
            .from('talents')
            .insert([talentData])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Talent added", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 2. PUBLIC IMPORT (IMDb / Wiki Placeholder)
exports.importTalent = async (req, res) => {
    try {
        const { public_url } = req.body;
        const { data, error } = await supabase
            .from('talents')
            .insert([{
                created_by: req.user.id,
                full_name: "Imported Profiling...",
                source_type: 'public_import',
                status: 'incomplete' // Mapping required later
            }])
            .select().single();

        if (error) throw error;
        res.json({ message: "Import mapping required", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 3. LEVEL 3: UPDATE COMMERCIALS
exports.updateCommercials = async (req, res) => {
    try {
        const { talent_id, budget_range, open_to_negotiation, work_preferences } = req.body;
        const { data, error } = await supabase
            .from('talent_commercials')
            .upsert({
                talent_id,
                budget_range,
                open_to_negotiation,
                work_preferences
            });

        if (error) throw error;
        res.json({ message: "Level 3 Commercials updated", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 4. AVAILABILITY: MARK CALENDAR
exports.setAvailability = async (req, res) => {
    try {
        const { talent_id, date, status } = req.body; // status: green, red, yellow
        const { data, error } = await supabase
            .from('availability_calendar')
            .upsert({ talent_id, date, status });

        if (error) throw error;
        res.json({ message: "Calendar marked", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 5. GET PROFESSIONAL'S TALENT POOL
exports.getTalentPool = async (req, res) => {
    try {
        const { status } = req.query;
        let query = supabase.from('talents').select('*').eq('created_by', req.user.id);

        if (status) query = query.eq('status', status);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// 6. UPDATE TALENT (Manual Update & Re-calculate Status)
exports.updateTalent = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const { data, error } = await supabase
            .from('talents')
            .update(updates)
            .eq('id', id)
            .eq('created_by', req.user.id)
            .select()
            .single();

        if (error) throw error;

        // Recalculate status after update
        const newStatus = calculateStatus(data);
        await supabase.from('talents').update({ status: newStatus }).eq('id', id);

        res.json({ message: "Talent updated", data: { ...data, status: newStatus } });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


