const supabase = require('../config/supabaseClient');

// UPDATE PERFORMER PROFILE (Level 2 Details)
exports.updatePerformerProfile = async (req, res) => {
    try {
        const {
            body_type,
            height_cm,
            screen_persona,
            languages,
            areas_of_interest,
            portfolio_style
        } = req.body;

        const userId = req.user.id;

        // 1. Ensure the user is an Actor/Performer (Security Check)
        const { data: roleCheck } = await supabase
            .from('user_roles')
            .select('role_id')
            .eq('user_id', userId)
            .single();

        if (!roleCheck || roleCheck.role_id !== 1) { // Assuming 1 is 'Actor / Performer'
            return res.status(403).json({ error: "Only Actors can create a portfolio." });
        }

        // 2. Upsert (Update or Insert) Performer Details
        const { data, error } = await supabase
            .from('performer_profiles')
            .upsert({
                user_id: userId,
                body_type,
                height_cm,
                screen_persona,
                languages,
                areas_of_interest,
                portfolio_style,
                updated_at: new Date()
            });

        if (error) throw error;

        res.json({ message: "Portfolio details saved successfully!", data });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// ADD PORTFOLIO IMAGE
exports.addPortfolioImage = async (req, res) => {
    try {
        const { image_url, image_type, display_order, is_primary } = req.body;
        const userId = req.user.id;

        const { data, error } = await supabase
            .from('portfolio_images')
            .insert([{
                user_id: userId,
                image_url,
                image_type,
                display_order,
                is_primary
            }]);

        if (error) throw error;

        res.status(201).json({ message: "Image added to portfolio!", data });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// SEARCH TALENT (For Producers/Directors)
exports.searchTalent = async (req, res) => {
    try {
        const { gender, state, min_height, max_height, language } = req.query;

        let query = supabase.from('talent_search_view').select('*');

        if (gender) query = query.eq('gender', gender);
        if (state) query = query.eq('state', state);
        if (min_height) query = query.gte('height_cm', min_height);
        if (max_height) query = query.lte('height_cm', max_height);
        if (language) query = query.contains('languages', [language]);

        const { data, error } = await query;
        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

// PROFILE HEALTH CHECK (Diagnostic for Level 2)
exports.getProfileHealth = async (req, res) => {
    try {
        const userId = req.user.id;

        // Fetch profile data
        const { data: profile } = await supabase
            .from('performer_profiles')
            .select('*')
            .eq('user_id', userId)
            .single();

        // Fetch image count
        const { data: images } = await supabase
            .from('portfolio_images')
            .select('is_primary')
            .eq('user_id', userId);

        const mandatoryFields = {
            'height_cm': 'Height',
            'body_type': 'Body Type',
            'languages': 'Languages',
            'screen_persona': 'Screen Persona',
            'areas_of_interest': 'Areas of Interest'
        };

        let missing = [];
        let completedCount = 0;
        const totalFields = Object.keys(mandatoryFields).length + 1; // +1 for primary image

        // Check fields
        for (const [key, label] of Object.entries(mandatoryFields)) {
            if (profile && profile[key] && (Array.isArray(profile[key]) ? profile[key].length > 0 : true)) {
                completedCount++;
            } else {
                missing.push(label);
            }
        }

        // Check primary image
        const hasPrimary = images?.some(img => img.is_primary);
        if (hasPrimary) completedCount++;
        else missing.push("Primary Profile Image");

        const percentage = Math.round((completedCount / totalFields) * 100);

        res.json({
            is_active: percentage === 100,
            completion_percentage: percentage,
            missing_fields: missing,
            advice: percentage < 100 ? "Complete missing fields to appear in global search results." : "Your profile is active and visible to seekers!"
        });

    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

