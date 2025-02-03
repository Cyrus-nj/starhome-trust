#[starknet::contract]
pub mod StarhomesContract {
    use starhomes::components::staking_component::AssetStakingComponent;
    use starhomes::components::property_component::PropertyComponent;
    use starhomes::components::user_component::UsersComponent;
    use starhomes::components::blogs_component::BlogComponent;
    use starhomes::components::property_investment_component::PropertyInvestmentComponent;
    use starhomes::interface::starhomes_interface::*;
    use core::option::Option;
    use starhomes::models::property_models::Property;
    use starhomes::models::investment_model::InvestmentAsset;
    use starhomes::messages::errors::Errors;
    use starknet::storage::StoragePointerReadAccess;
    use starknet::storage::StoragePointerWriteAccess;
    use starhomes::interfaces::iStarhomes::IStarhomesContract;
    use starknet::ContractAddress;
    use starknet::class_hash::ClassHash;

    use core::array::ArrayTrait;
    use core::traits::Into;
    use openzeppelin::access::ownable::OwnableComponent;
    use openzeppelin::upgrades::UpgradeableComponent;
    use openzeppelin::upgrades::interface::IUpgradeable;

    component!(path: OwnableComponent, storage: ownable, event: OwnableEvent);
    component!(path: UpgradeableComponent, storage: upgradeable, event: UpgradeableEvent);
    component!(path: AssetStakingComponent, storage: stake_to_property, event: AssetStakingEvent);
    component!(path: UsersComponent, storage: users_data, event: UsersEvent);
    component!(path: PropertyComponent, storage: properties, event: PropertyComponentEvent);
    component!(path: BlogComponent, storage: blogs, event: BlogsComponentEvent);
    component!(path: PropertyInvestmentComponent, storage: property_investments, event: PropertyInvestmentEvent);

    impl PropertyComponentImpl = PropertyComponent::PropertyComponentImpl<ContractState>;
    impl PropertyPrivateFunctions = PropertyComponent::PropertyFunctions<ContractState>;

    impl AssetStakingComponentImpl = AssetStakingComponent::StakeAssetImpl<ContractState>;
    impl StakingPrivateFunctions = AssetStakingComponent::StakingPrivateFunctions<ContractState>;

    #[abi(embed_v0)]
    impl UsersComponentImpl = UsersComponent::UsersComponentImpl<ContractState>;
    impl UsersPrivateFunctions = UsersComponent::UsersPrivateFunctions<ContractState>;

    #[abi(embed_v0)]
    impl BlogComponentImpl = BlogComponent::BlogsComponentImpl<ContractState>;
    #[abi(embed_v0)]
    impl PropertyInvestmentImpl = PropertyInvestmentComponent::PropertyInvestmentImpl<ContractState>;

    // Ownable Mixin
    #[abi(embed_v0)]
    impl OwnableMixinImpl = OwnableComponent::OwnableMixinImpl<ContractState>;
    impl OwnableInternalImpl = OwnableComponent::InternalImpl<ContractState>;

    // Upgradeable
    impl UpgradeableInternalImpl = UpgradeableComponent::InternalImpl<ContractState>;

    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        #[flat]
        OwnableEvent: OwnableComponent::Event,
        #[flat]
        UpgradeableEvent: UpgradeableComponent::Event,
        #[flat]
        AssetStakingEvent: AssetStakingComponent::Event,
        #[flat]
        UsersEvent: UsersComponent::Event,
        #[flat]
        PropertyComponentEvent: PropertyComponent::Event,
        #[flat]
        BlogsComponentEvent: BlogComponent::Event,
        #[flat]
        PropertyInvestmentEvent: PropertyInvestmentComponent::Event,
    }

    #[storage]
    struct Storage {
        #[substorage(v0)]
        properties: PropertyComponent::Storage,
        #[substorage(v0)]
        stake_to_property: AssetStakingComponent::Storage,
        #[substorage(v0)]
        users_data: UsersComponent::Storage,
        #[substorage(v0)]
        ownable: OwnableComponent::Storage,
        #[substorage(v0)]
        upgradeable: UpgradeableComponent::Storage,
        #[substorage(v0)]
        blogs: BlogComponent::Storage,
        #[substorage(v0)]
        property_investments: PropertyInvestmentComponent::Storage,
        contract_owner: ContractAddress,
        version: u64,
    }

    #[constructor]
    fn constructor(ref self: ContractState, owner: ContractAddress) {
        self.ownable.initializer(owner);
        self.properties._initialize_property_count();
    }

    #[abi(embed_v0)]
    impl StarhomesContractImpl of IStarhomesContract<ContractState> {
        fn list_property(ref self: ContractState, property: Property) -> felt252 {
            let agent_id = property.agent_id.clone();
            let isRegistered = self.users_data.is_agent_registered(agent_id);
            assert(isRegistered, Errors::AGENT_NOT_REGISTERED);
            self.properties.list_property(property)
        }
        fn list_investment_property(ref self: ContractState, investment_asset: InvestmentAsset) {
            self
                .stake_to_property
                .initialize_asset_staking_token(
                    investment_asset.investment_token, investment_asset.id,
                );

            self.properties.list_investment_property(investment_asset);
        }

        fn edit_property(
            ref self: ContractState, property_id: felt252, property: Property,
        ) -> felt252 {
            self.properties.edit_property(property_id, property)
        }
        fn edit_listed_investment_property(
            ref self: ContractState, investment_id: felt252, investment: InvestmentAsset,
        ) -> felt252 {
            self.properties.edit_listed_investment_property(investment_id, investment)
        }

        fn invest_in_property(ref self: ContractState, investment_id: felt252, amount: u256) {
            assert(
                self.properties._is_investment_added(investment_id) == true, 'Investment not Available',
            );
            self.stake_to_property.stake(investment_id, amount.into());
            let investment = self.get_investment(investment_id);
            assert(investment.available_staking_amount >amount, 'Stake Lower amount');
            self
                .properties
                .edit_listed_investment(
                    investment_id,
                    InvestmentAsset {
                        available_staking_amount: investment.available_staking_amount - amount,
                        ..investment,
                    },
                );
        }
         fn withdraw_from_property(ref self: ContractState, investment_id: felt252, amount: u256) {
            
            assert(
                self.properties._is_investment_added(investment_id) == true, 'Investment not Available',
            );
            self.stake_to_property.withdraw(investment_id, amount.into());
            let investment = self.get_investment(investment_id);
           
            self
                .properties
                .edit_listed_investment(
                    investment_id,
                    InvestmentAsset {
                        available_staking_amount: investment.available_staking_amount - amount,
                        ..investment,
                    },
                );
        }
        fn get_property(self: @ContractState, property_id: felt252) -> Property {
            self.properties.get_property_by_id(property_id)
        }
        fn get_sale_properties(self: @ContractState) -> Array<Property> {
            self.properties.get_sale_properties()
        }
        fn get_sale_properties_by_agent(
            self: @ContractState, agent_id: ContractAddress,
        ) -> Array<Property> {
            self.properties.get_sale_properties_by_agent(agent_id)
        }

        fn get_investment_properties_by_lister(
            self: @ContractState, lister_id: ContractAddress,
        ) -> Array<InvestmentAsset> {
            self.properties.get_investment_properties_by_lister(lister_id)
        }

        fn get_investment_properties(self: @ContractState) -> Array<InvestmentAsset> {
            self.properties.get_investment_properties()
        }
        fn get_investment(self: @ContractState, investment_id: felt252) -> InvestmentAsset {
            self.properties.get_investment_by_id(investment_id)
        }
        fn version(self: @ContractState) -> u64 {
            self.version.read()
        }
    }

    #[abi(embed_v0)]
    impl UpgradeableImpl of IUpgradeable<ContractState> {
        fn upgrade(ref self: ContractState, new_class_hash: ClassHash) {
            // Only owner can upgrade
            self.ownable.assert_only_owner();
            let contract_version = self.version.read();
            self.version.write(contract_version + 1);
            self.upgradeable.upgrade(new_class_hash);
        }
    }
}
