-- Add read access required by operational maintenance without mutating the
-- already-applied 0005_service_facilities.sql migration.

grant select on munch.tool_events to munch_service;
