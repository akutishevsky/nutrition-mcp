import { withBillingDatabase } from "../platform/database.js";

export interface BillableAccount {
    userId: string;
    email: string;
    stripeCustomerId: string | null;
    hasPriorSubscription: boolean;
}

export async function getBillableAccount(
    userId: string,
): Promise<BillableAccount | null> {
    return withBillingDatabase(async (tx) => {
        const rows = await tx<
            Array<{
                user_id: string;
                email: string;
                stripe_customer_id: string | null;
                has_prior_subscription: boolean;
            }>
        >`
            select
                users.id as user_id,
                users.email,
                customers.stripe_customer_id,
                exists (
                    select 1
                    from munch.subscriptions subscriptions
                    where subscriptions.user_id = users.id
                ) as has_prior_subscription
            from munch.users users
            left join munch.stripe_customers customers
                on customers.user_id = users.id
            where users.id = ${userId}
              and users.status in ('pending', 'active')
        `;
        const row = rows[0];
        return row
            ? {
                  userId: row.user_id,
                  email: row.email,
                  stripeCustomerId: row.stripe_customer_id,
                  hasPriorSubscription: row.has_prior_subscription,
              }
            : null;
    });
}
