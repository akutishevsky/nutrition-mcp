alter table munch.meal_drafts
    drop constraint meal_drafts_confirmation_consistency;

alter table munch.meal_drafts
    add constraint meal_drafts_confirmation_consistency check (
        status = 'confirmed'
        or confirmed_meal_id is null
    );

comment on constraint meal_drafts_confirmation_consistency on munch.meal_drafts is
    'Active and cancelled drafts cannot reference a meal; confirmed drafts may retain a cleared reference after the meal is deleted';
