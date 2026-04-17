


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."auth_codes" (
    "code" "text" NOT NULL,
    "redirect_uri" "text" NOT NULL,
    "code_challenge" "text",
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid" NOT NULL
);


ALTER TABLE "public"."auth_codes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."meals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "logged_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "meal_type" "text",
    "description" "text" NOT NULL,
    "calories" integer,
    "protein_g" numeric,
    "carbs_g" numeric,
    "fat_g" numeric,
    "notes" "text",
    "user_id" "uuid",
    CONSTRAINT "meals_meal_type_check" CHECK (("meal_type" = ANY (ARRAY['breakfast'::"text", 'lunch'::"text", 'dinner'::"text", 'snack'::"text"])))
);


ALTER TABLE "public"."meals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."oauth_tokens" (
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "user_id" "uuid"
);


ALTER TABLE "public"."oauth_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."refresh_tokens" (
    "token" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."refresh_tokens" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registered_clients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "client_name" character varying(255),
    "redirect_uris" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."registered_clients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tool_analytics" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" character varying(255) NOT NULL,
    "tool_name" character varying(100) NOT NULL,
    "success" boolean NOT NULL,
    "duration_ms" integer NOT NULL,
    "error_category" character varying(50),
    "date_range_days" integer,
    "mcp_session_id" character varying(255),
    "invoked_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tool_analytics" OWNER TO "postgres";


ALTER TABLE ONLY "public"."auth_codes"
    ADD CONSTRAINT "auth_codes_pkey" PRIMARY KEY ("code");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."oauth_tokens"
    ADD CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("token");



ALTER TABLE ONLY "public"."registered_clients"
    ADD CONSTRAINT "registered_clients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tool_analytics"
    ADD CONSTRAINT "tool_analytics_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_auth_codes_expires_at" ON "public"."auth_codes" USING "btree" ("expires_at");



CREATE INDEX "idx_meals_logged_at" ON "public"."meals" USING "btree" ("logged_at");



CREATE INDEX "idx_meals_user_id" ON "public"."meals" USING "btree" ("user_id");



CREATE INDEX "idx_oauth_tokens_expires_at" ON "public"."oauth_tokens" USING "btree" ("expires_at");



CREATE INDEX "idx_oauth_tokens_user_id" ON "public"."oauth_tokens" USING "btree" ("user_id");



CREATE INDEX "idx_tool_analytics_invoked_at" ON "public"."tool_analytics" USING "btree" ("invoked_at");



CREATE INDEX "idx_tool_analytics_tool_name" ON "public"."tool_analytics" USING "btree" ("tool_name");



CREATE INDEX "idx_tool_analytics_user_id" ON "public"."tool_analytics" USING "btree" ("user_id");



CREATE INDEX "idx_tool_analytics_user_tool" ON "public"."tool_analytics" USING "btree" ("user_id", "tool_name");



ALTER TABLE ONLY "public"."auth_codes"
    ADD CONSTRAINT "auth_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."meals"
    ADD CONSTRAINT "meals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."oauth_tokens"
    ADD CONSTRAINT "oauth_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."refresh_tokens"
    ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow all for service role" ON "public"."auth_codes" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for service role" ON "public"."meals" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for service role" ON "public"."oauth_tokens" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for service role" ON "public"."refresh_tokens" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for service role" ON "public"."registered_clients" USING (true) WITH CHECK (true);



CREATE POLICY "Allow all for service role" ON "public"."tool_analytics" USING (true) WITH CHECK (true);



ALTER TABLE "public"."auth_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."meals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."oauth_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."refresh_tokens" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registered_clients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tool_analytics" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON TABLE "public"."auth_codes" TO "anon";
GRANT ALL ON TABLE "public"."auth_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_codes" TO "service_role";



GRANT ALL ON TABLE "public"."meals" TO "anon";
GRANT ALL ON TABLE "public"."meals" TO "authenticated";
GRANT ALL ON TABLE "public"."meals" TO "service_role";



GRANT ALL ON TABLE "public"."oauth_tokens" TO "anon";
GRANT ALL ON TABLE "public"."oauth_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."oauth_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."refresh_tokens" TO "anon";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."refresh_tokens" TO "service_role";



GRANT ALL ON TABLE "public"."registered_clients" TO "anon";
GRANT ALL ON TABLE "public"."registered_clients" TO "authenticated";
GRANT ALL ON TABLE "public"."registered_clients" TO "service_role";



GRANT ALL ON TABLE "public"."tool_analytics" TO "anon";
GRANT ALL ON TABLE "public"."tool_analytics" TO "authenticated";
GRANT ALL ON TABLE "public"."tool_analytics" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







