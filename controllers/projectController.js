const supabase = require('../config/supabaseClient');

// CREATE A PROJECT
exports.createProject = async (req, res) => {
    try {
        const { title, description, project_type } = req.body;
        const { data, error } = await supabase
            .from('projects')
            .insert([{ title, description, project_type, created_by: req.user.id }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Project created", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// GET ALL PROJECTS
exports.getProjects = async (req, res) => {
    try {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ADD TO SHORTLIST (The "Save" Action)
exports.addToShortlist = async (req, res) => {
    try {
        const { project_id, performer_id, talent_id, notes } = req.body;
        const { data, error } = await supabase
            .from('shortlists')
            .insert([{
                owner_id: req.user.id,
                project_id,
                performer_id,
                talent_id,
                notes
            }])
            .select()
            .single();

        if (error) throw error;
        res.status(201).json({ message: "Added to shortlist", data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// VIEW SHORTLIST FOR A PROJECT
exports.getShortlist = async (req, res) => {
    try {
        const { project_id } = req.params;
        const { data, error } = await supabase
            .from('shortlists')
            .select(`
                *,
                performer:users!performer_id(id, full_name, email),
                talents(id, full_name)
            `)
            .eq('project_id', project_id)
            .eq('owner_id', req.user.id);

        if (error) throw error;
        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// UPDATE STATUS (Interested -> Auditioned -> Selected)
exports.updateShortlistStatus = async (req, res) => {
    try {
        const { id } = req.params; // Shortlist record ID
        const { selection_status } = req.body;

        const { data, error } = await supabase
            .from('shortlists')
            .update({ selection_status })
            .eq('id', id)
            .eq('owner_id', req.user.id)
            .select()
            .single();

        if (error) throw error;
        res.json({ message: `Status updated to ${selection_status}`, data });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};


