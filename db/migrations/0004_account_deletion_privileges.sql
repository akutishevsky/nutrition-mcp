-- Permanent account deletion retains sanitized operational audit events while
-- severing user identifiers. Grant only the two identifier columns required by
-- that process rather than broad access to the audit ledger.
grant select (actor_id, subject_user_id),
      update (actor_id, subject_user_id)
    on munch.audit_events
    to munch_auth;
