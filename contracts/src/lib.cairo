pub mod messages {
    pub mod errors;
    pub mod success;
}
pub mod models {
    pub mod property_models;
    pub mod investment_model;
    pub mod user_models;
    pub mod contract_events;
    pub mod blogs_model;
}

pub mod components {
    pub mod property_component;
    pub mod investment_component;
    pub mod user_component;
    pub mod blogs_component;
}
pub mod interfaces {
    pub mod user_interface;
    pub mod investment_interface;
    pub mod iStarhomes;
    pub mod asset_staking;
    pub mod property;
    pub mod blogs_interface;
}
pub mod starhomes_contract {
    pub mod starhomes;
}

