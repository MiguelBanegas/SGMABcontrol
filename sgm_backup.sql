--
-- PostgreSQL database dump
--

\restrict qSAj7lx2GxzbppQj14MpaE8VhIsaAag7D8lOoDIta5KcFW9t3MZUA57zR2UAHgt

-- Dumped from database version 18.1
-- Dumped by pg_dump version 18.1

-- Started on 2026-01-17 14:37:38

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 25750)
-- Name: businesses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.businesses (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    tax_id character varying(255),
    address character varying(255),
    phone character varying(255),
    email character varying(255),
    logo_url character varying(255),
    settings jsonb DEFAULT '{}'::jsonb,
    active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.businesses OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 25763)
-- Name: businesses_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.businesses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.businesses_id_seq OWNER TO postgres;

--
-- TOC entry 5173 (class 0 OID 0)
-- Dependencies: 220
-- Name: businesses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.businesses_id_seq OWNED BY public.businesses.id;


--
-- TOC entry 221 (class 1259 OID 25764)
-- Name: cash_movements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_movements (
    id integer NOT NULL,
    cash_register_id uuid NOT NULL,
    type text NOT NULL,
    amount numeric(12,2) NOT NULL,
    description text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method character varying(255) DEFAULT 'Efectivo'::character varying,
    CONSTRAINT cash_movements_type_check CHECK ((type = ANY (ARRAY['expense'::text, 'withdrawal'::text])))
);


ALTER TABLE public.cash_movements OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 25777)
-- Name: cash_movements_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.cash_movements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.cash_movements_id_seq OWNER TO postgres;

--
-- TOC entry 5174 (class 0 OID 0)
-- Dependencies: 222
-- Name: cash_movements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.cash_movements_id_seq OWNED BY public.cash_movements.id;


--
-- TOC entry 223 (class 1259 OID 25778)
-- Name: cash_registers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cash_registers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id integer NOT NULL,
    user_id integer NOT NULL,
    opening_amount numeric(12,2) NOT NULL,
    closing_amount numeric(12,2),
    expected_amount numeric(12,2),
    difference numeric(12,2),
    cash_sales numeric(12,2) DEFAULT '0'::numeric,
    expenses numeric(12,2) DEFAULT '0'::numeric,
    withdrawals numeric(12,2) DEFAULT '0'::numeric,
    status text DEFAULT 'open'::text,
    opened_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    closed_at timestamp with time zone,
    notes text,
    transfer_sales numeric(12,2) DEFAULT '0'::numeric,
    debit_sales numeric(12,2) DEFAULT '0'::numeric,
    credit_sales numeric(12,2) DEFAULT '0'::numeric,
    account_sales numeric(12,2) DEFAULT '0'::numeric,
    account_payments numeric(12,2) DEFAULT '0'::numeric,
    CONSTRAINT cash_registers_status_check CHECK ((status = ANY (ARRAY['open'::text, 'closed'::text])))
);


ALTER TABLE public.cash_registers OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 25799)
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    active boolean DEFAULT true NOT NULL,
    business_id integer NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 25807)
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- TOC entry 5175 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- TOC entry 226 (class 1259 OID 25808)
-- Name: customer_account_transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customer_account_transactions (
    id integer NOT NULL,
    customer_id integer NOT NULL,
    sale_id uuid,
    type character varying(255) NOT NULL,
    amount numeric(10,2) NOT NULL,
    balance numeric(10,2) NOT NULL,
    description text,
    business_id integer NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    payment_method character varying(255)
);


ALTER TABLE public.customer_account_transactions OWNER TO postgres;

--
-- TOC entry 5176 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN customer_account_transactions.type; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customer_account_transactions.type IS 'debt or payment';


--
-- TOC entry 5177 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN customer_account_transactions.balance; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.customer_account_transactions.balance IS 'Balance after this transaction';


--
-- TOC entry 227 (class 1259 OID 25820)
-- Name: customer_account_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customer_account_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customer_account_transactions_id_seq OWNER TO postgres;

--
-- TOC entry 5178 (class 0 OID 0)
-- Dependencies: 227
-- Name: customer_account_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customer_account_transactions_id_seq OWNED BY public.customer_account_transactions.id;


--
-- TOC entry 228 (class 1259 OID 25821)
-- Name: customers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.customers (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255),
    phone character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    business_id integer NOT NULL,
    is_active boolean DEFAULT true,
    notes text
);


ALTER TABLE public.customers OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 25834)
-- Name: customers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.customers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.customers_id_seq OWNER TO postgres;

--
-- TOC entry 5179 (class 0 OID 0)
-- Dependencies: 229
-- Name: customers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.customers_id_seq OWNED BY public.customers.id;


--
-- TOC entry 230 (class 1259 OID 25835)
-- Name: knex_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations (
    id integer NOT NULL,
    name character varying(255),
    batch integer,
    migration_time timestamp with time zone
);


ALTER TABLE public.knex_migrations OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 25839)
-- Name: knex_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5180 (class 0 OID 0)
-- Dependencies: 231
-- Name: knex_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knex_migrations_id_seq OWNED BY public.knex_migrations.id;


--
-- TOC entry 232 (class 1259 OID 25840)
-- Name: knex_migrations_lock; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.knex_migrations_lock (
    index integer NOT NULL,
    is_locked integer
);


ALTER TABLE public.knex_migrations_lock OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 25844)
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.knex_migrations_lock_index_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNER TO postgres;

--
-- TOC entry 5181 (class 0 OID 0)
-- Dependencies: 233
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.knex_migrations_lock_index_seq OWNED BY public.knex_migrations_lock.index;


--
-- TOC entry 234 (class 1259 OID 25845)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    type character varying(255) DEFAULT 'nota'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    business_id integer NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 25856)
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- TOC entry 5182 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- TOC entry 236 (class 1259 OID 25857)
-- Name: pending_sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_sales (
    id integer NOT NULL,
    user_id integer NOT NULL,
    cart_data text NOT NULL,
    customer_id integer,
    payment_method character varying(50),
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    business_id integer NOT NULL
);


ALTER TABLE public.pending_sales OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 25867)
-- Name: pending_sales_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pending_sales_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_sales_id_seq OWNER TO postgres;

--
-- TOC entry 5183 (class 0 OID 0)
-- Dependencies: 237
-- Name: pending_sales_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pending_sales_id_seq OWNED BY public.pending_sales.id;


--
-- TOC entry 238 (class 1259 OID 25868)
-- Name: pending_sales_multiple; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_sales_multiple (
    id integer NOT NULL,
    user_id integer,
    business_id integer,
    customer_id integer,
    payment_method character varying(50) DEFAULT 'Efectivo'::character varying,
    cart jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.pending_sales_multiple OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 25879)
-- Name: pending_sales_multiple_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pending_sales_multiple_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pending_sales_multiple_id_seq OWNER TO postgres;

--
-- TOC entry 5184 (class 0 OID 0)
-- Dependencies: 239
-- Name: pending_sales_multiple_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pending_sales_multiple_id_seq OWNED BY public.pending_sales_multiple.id;


--
-- TOC entry 240 (class 1259 OID 25880)
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    sku character varying(255) NOT NULL,
    price_buy numeric(10,2),
    price_sell numeric(10,2) NOT NULL,
    stock numeric(10,3),
    category_id integer,
    image_url character varying(255),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    sell_by_weight boolean DEFAULT false,
    price_offer numeric(10,2),
    is_offer boolean DEFAULT false,
    active boolean DEFAULT true NOT NULL,
    promo_buy integer,
    promo_pay integer,
    promo_type character varying(20) DEFAULT 'none'::character varying,
    business_id integer NOT NULL
);


ALTER TABLE public.products OWNER TO postgres;

--
-- TOC entry 241 (class 1259 OID 25899)
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- TOC entry 5185 (class 0 OID 0)
-- Dependencies: 241
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- TOC entry 242 (class 1259 OID 25900)
-- Name: purchase_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchase_items (
    id integer NOT NULL,
    purchase_id uuid NOT NULL,
    product_id integer NOT NULL,
    quantity numeric(10,2) NOT NULL,
    price_buy numeric(10,2) NOT NULL,
    subtotal numeric(12,2) NOT NULL
);


ALTER TABLE public.purchase_items OWNER TO postgres;

--
-- TOC entry 243 (class 1259 OID 25909)
-- Name: purchase_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.purchase_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.purchase_items_id_seq OWNER TO postgres;

--
-- TOC entry 5186 (class 0 OID 0)
-- Dependencies: 243
-- Name: purchase_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.purchase_items_id_seq OWNED BY public.purchase_items.id;


--
-- TOC entry 244 (class 1259 OID 25910)
-- Name: purchases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id integer NOT NULL,
    user_id integer NOT NULL,
    total numeric(12,2) NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.purchases OWNER TO postgres;

--
-- TOC entry 245 (class 1259 OID 25921)
-- Name: sale_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sale_items (
    id integer NOT NULL,
    sale_id uuid,
    product_id integer,
    quantity numeric(10,3),
    price_unit numeric(10,2) NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    cost_at_sale numeric(10,2),
    discount_amount numeric(10,2) DEFAULT '0'::numeric,
    promo_type character varying(255) DEFAULT 'none'::character varying,
    promo_buy integer,
    promo_pay integer,
    price_sell_at_sale numeric(10,2),
    price_offer_at_sale numeric(10,2),
    sell_by_weight boolean DEFAULT false
);


ALTER TABLE public.sale_items OWNER TO postgres;

--
-- TOC entry 246 (class 1259 OID 25930)
-- Name: sale_items_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sale_items_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sale_items_id_seq OWNER TO postgres;

--
-- TOC entry 5187 (class 0 OID 0)
-- Dependencies: 246
-- Name: sale_items_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sale_items_id_seq OWNED BY public.sale_items.id;


--
-- TOC entry 247 (class 1259 OID 25931)
-- Name: sales; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sales (
    id uuid NOT NULL,
    user_id integer,
    total numeric(10,2) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    customer_id integer,
    payment_method character varying(255) DEFAULT 'Efectivo'::character varying,
    status character varying(255) DEFAULT 'completado'::character varying,
    subtotal numeric(10,2),
    cash_discount numeric(10,2) DEFAULT '0'::numeric,
    business_id integer NOT NULL,
    amount_paid numeric(10,2),
    change_given numeric(10,2),
    debt_amount numeric(10,2),
    settled_at timestamp with time zone,
    credit_applied numeric(12,2) DEFAULT '0'::numeric,
    cash_register_id uuid
);


ALTER TABLE public.sales OWNER TO postgres;

--
-- TOC entry 5188 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN sales.amount_paid; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sales.amount_paid IS 'Monto recibido del cliente';


--
-- TOC entry 5189 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN sales.change_given; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sales.change_given IS 'Vuelto entregado';


--
-- TOC entry 5190 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN sales.debt_amount; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sales.debt_amount IS 'Deuda pendiente';


--
-- TOC entry 5191 (class 0 OID 0)
-- Dependencies: 247
-- Name: COLUMN sales.settled_at; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sales.settled_at IS 'Fecha y hora en que la deuda fue saldada';


--
-- TOC entry 248 (class 1259 OID 25944)
-- Name: settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.settings (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    business_id integer NOT NULL
);


ALTER TABLE public.settings OWNER TO postgres;

--
-- TOC entry 249 (class 1259 OID 25953)
-- Name: settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.settings_id_seq OWNER TO postgres;

--
-- TOC entry 5192 (class 0 OID 0)
-- Dependencies: 249
-- Name: settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;


--
-- TOC entry 250 (class 1259 OID 25954)
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    role character varying(255) DEFAULT 'vendedor'::character varying,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    business_id integer NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- TOC entry 251 (class 1259 OID 25968)
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- TOC entry 5193 (class 0 OID 0)
-- Dependencies: 251
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- TOC entry 4837 (class 2604 OID 25969)
-- Name: businesses id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses ALTER COLUMN id SET DEFAULT nextval('public.businesses_id_seq'::regclass);


--
-- TOC entry 4842 (class 2604 OID 25970)
-- Name: cash_movements id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_movements ALTER COLUMN id SET DEFAULT nextval('public.cash_movements_id_seq'::regclass);


--
-- TOC entry 4856 (class 2604 OID 25971)
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- TOC entry 4858 (class 2604 OID 25972)
-- Name: customer_account_transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_transactions ALTER COLUMN id SET DEFAULT nextval('public.customer_account_transactions_id_seq'::regclass);


--
-- TOC entry 4860 (class 2604 OID 25973)
-- Name: customers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers ALTER COLUMN id SET DEFAULT nextval('public.customers_id_seq'::regclass);


--
-- TOC entry 4864 (class 2604 OID 25974)
-- Name: knex_migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations ALTER COLUMN id SET DEFAULT nextval('public.knex_migrations_id_seq'::regclass);


--
-- TOC entry 4865 (class 2604 OID 25975)
-- Name: knex_migrations_lock index; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_lock ALTER COLUMN index SET DEFAULT nextval('public.knex_migrations_lock_index_seq'::regclass);


--
-- TOC entry 4866 (class 2604 OID 25976)
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- TOC entry 4870 (class 2604 OID 25977)
-- Name: pending_sales id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales ALTER COLUMN id SET DEFAULT nextval('public.pending_sales_id_seq'::regclass);


--
-- TOC entry 4872 (class 2604 OID 25978)
-- Name: pending_sales_multiple id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales_multiple ALTER COLUMN id SET DEFAULT nextval('public.pending_sales_multiple_id_seq'::regclass);


--
-- TOC entry 4877 (class 2604 OID 25979)
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- TOC entry 4884 (class 2604 OID 25980)
-- Name: purchase_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items ALTER COLUMN id SET DEFAULT nextval('public.purchase_items_id_seq'::regclass);


--
-- TOC entry 4887 (class 2604 OID 25981)
-- Name: sale_items id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items ALTER COLUMN id SET DEFAULT nextval('public.sale_items_id_seq'::regclass);


--
-- TOC entry 4896 (class 2604 OID 25982)
-- Name: settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq'::regclass);


--
-- TOC entry 4898 (class 2604 OID 25983)
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- TOC entry 5135 (class 0 OID 25750)
-- Dependencies: 219
-- Data for Name: businesses; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.businesses (id, name, tax_id, address, phone, email, logo_url, settings, active, created_at, updated_at) FROM stdin;
1	Comercio Principal	\N	\N	\N	\N	\N	{}	t	2026-01-07 14:26:23.55121-03	2026-01-07 14:26:23.55121-03
\.


--
-- TOC entry 5137 (class 0 OID 25764)
-- Dependencies: 221
-- Data for Name: cash_movements; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_movements (id, cash_register_id, type, amount, description, created_at, payment_method) FROM stdin;
1	c896c781-f941-4ccb-af5b-63eba019ccfe	expense	1500.00	compre bolsas	2026-01-14 02:00:40.993111-03	Efectivo
2	c896c781-f941-4ccb-af5b-63eba019ccfe	withdrawal	2000.00	saque para cargar celu	2026-01-14 02:01:04.03785-03	Efectivo
\.


--
-- TOC entry 5139 (class 0 OID 25778)
-- Dependencies: 223
-- Data for Name: cash_registers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cash_registers (id, business_id, user_id, opening_amount, closing_amount, expected_amount, difference, cash_sales, expenses, withdrawals, status, opened_at, closed_at, notes, transfer_sales, debit_sales, credit_sales, account_sales, account_payments) FROM stdin;
c896c781-f941-4ccb-af5b-63eba019ccfe	1	4	10000.00	33079.00	33078.13	0.87	26578.13	1500.00	2000.00	closed	2026-01-14 01:35:12.817284-03	2026-01-14 02:02:49.684023-03	\N	0.00	0.00	0.00	12687.50	0.00
864e1ad7-da2f-4da0-9b13-d2973fc452db	1	1	10000.00	183307.00	183306.25	0.75	173306.25	0.00	0.00	closed	2026-01-14 02:14:44.908857-03	2026-01-14 20:39:05.967556-03	\N	0.00	0.00	0.00	32050.00	0.00
\.


--
-- TOC entry 5140 (class 0 OID 25799)
-- Dependencies: 224
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name, active, business_id) FROM stdin;
6	gaseosas	t	1
7	limpieza	t	1
8	fiambres	t	1
9	helados	t	1
2	Hogar	f	1
10	alimentos	t	1
3	Alimentos	f	1
11	kiosco	t	1
12	VINOS	t	1
13	CAFE	t	1
14	CONDIMENTOS	t	1
15	MASCOTA	t	1
16	ENRGISANTES	t	1
17	CONGELADOS	t	1
18	GOLOSINAS	t	1
19	BEBIDA	t	1
20	FIAMBRERIA	t	1
21	ALMACEN	t	1
22	LIMPIEZA	t	1
23	AGUAS	t	1
24	APERITIVOS	t	1
25	GALLETITAS	t	1
26	LACTEOS	t	1
27	VERDULERIAS	t	1
28	MASCOTAS	t	1
29	ART.LIMPIEZA	t	1
30	FARMACIA	t	1
31	PAPEL	t	1
32	CHOCOLATES	t	1
33	PERFUMERIA	t	1
34	FRUTAS Y VERDURAS	t	1
35	FRUTAS SECAS	t	1
36	CERVEZA	t	1
37	BODEGA	t	1
38	PEGAMENTOS	t	1
39	ART VARIOS	t	1
40	CERRALES	t	1
41	ALIMENTO GATO	t	1
42	FRESCOS	t	1
43	HELADOS	t	1
44	JUGOS	t	1
45	PANIFICADOS	t	1
46	PRODUCTOS SUELTOS	t	1
47	LATAS	t	1
48	POLLO	t	1
49	GASEOSAS	t	1
50	INSUMO	t	1
51	CIGARRILLO	t	1
52	UNIDAD	t	1
53	HARINAS	t	1
54	REGALERIA	t	1
55	MEDIAS	t	1
56	BIJOUTERI	t	1
57	SAPHIRUS	t	1
58	JUGUETES	t	1
59	LIBRERIA	t	1
60	ESNMALTES	t	1
61	NATURA	t	1
62	ACCESORIOS CELULARES	t	1
63	BAZAR	t	1
65	HELADERIA	t	1
66	TOALLITAS	t	1
\.


--
-- TOC entry 5142 (class 0 OID 25808)
-- Dependencies: 226
-- Data for Name: customer_account_transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customer_account_transactions (id, customer_id, sale_id, type, amount, balance, description, business_id, created_at, payment_method) FROM stdin;
81	2092	5951f0be-c0c9-4536-a930-9a8f8af4aa26	debt	5062.50	5062.50	Venta #5951f0be (Total: $5062.50)	1	2026-01-14 01:58:16.468424-03	\N
82	2092	ae6a3c11-325e-4bcc-b3fb-1baec7fbdfcc	debt	5062.50	10125.00	Venta #ae6a3c11 (Total: $5062.50)	1	2026-01-14 01:59:09.141377-03	\N
83	2092	ae6a3c11-325e-4bcc-b3fb-1baec7fbdfcc	payment	2500.00	7625.00	Pago contado en Venta #ae6a3c11	1	2026-01-14 01:59:09.141377-03	\N
84	2092	5951f0be-c0c9-4536-a930-9a8f8af4aa26	payment	5062.50	2562.50	Pago deuda revalorizada (Venta 5951f0be)	1	2026-01-14 02:17:00.654807-03	\N
87	2092	a26aa846-5864-4830-87b5-7a23642b9f53	debt	13162.50	15725.00	Venta #a26aa846 (Editada)	1	2026-01-14 18:59:31.948-03	\N
88	2092	e6961c09-61a2-4640-8ffb-e1a94606eadb	debt	13162.50	28887.50	Venta #e6961c09 (Total: $13162.50)	1	2026-01-14 20:17:28.00111-03	\N
89	2092	e6961c09-61a2-4640-8ffb-e1a94606eadb	payment	10000.00	18887.50	Pago contado en Venta #e6961c09	1	2026-01-14 20:17:28.00111-03	\N
90	2755	b4164b25-d599-45db-8e77-2736187512db	debt	32906.25	32906.25	Venta #b4164b25 (Editada)	1	2026-01-14 20:27:56.152-03	\N
91	2755	b4164b25-d599-45db-8e77-2736187512db	payment	32906.25	0.00	Pago contado en Venta #b4164b25 (Editada)	1	2026-01-14 20:27:56.152-03	\N
92	2092	a26aa846-5864-4830-87b5-7a23642b9f53	payment	3900.00	14987.50	Pago deuda revalorizada (Venta a26aa846)	1	2026-01-14 21:49:52.860113-03	Efectivo
93	2092	ae6a3c11-325e-4bcc-b3fb-1baec7fbdfcc	payment	2562.50	12425.00	Pago de deuda del 14/01/2026, 01:59 a. m.	1	2026-01-14 21:50:10.861375-03	Efectivo
94	2092	\N	payment	12425.00	0.00	Pago recibido - $12425.00	1	2026-01-14 21:51:27.121677-03	Efectivo
95	2092	f5bf5233-a11c-4d7d-bbc4-6134060fddea	debt	800.00	800.00	Venta #f5bf5233 (Total: $800.00)	1	2026-01-14 21:52:13.463118-03	\N
96	2092	f5bf5233-a11c-4d7d-bbc4-6134060fddea	payment	800.00	0.00	Pago de deuda del 14/01/2026, 09:52 p. m.	1	2026-01-14 21:52:31.97768-03	Efectivo
97	2092	9ac505f4-5933-4825-8cf1-05324512b06e	debt	5062.50	5062.50	Venta #9ac505f4 (Total: $5062.50)	1	2026-01-14 21:53:55.821949-03	\N
98	2092	9ac505f4-5933-4825-8cf1-05324512b06e	payment	1000.00	4062.50	Pago contado en Venta #9ac505f4	1	2026-01-14 21:53:55.821949-03	\N
99	2092	9ac505f4-5933-4825-8cf1-05324512b06e	payment	4062.50	0.00	Pago deuda revalorizada (Venta 9ac505f4)	1	2026-01-14 21:54:49.19531-03	Efectivo
\.


--
-- TOC entry 5144 (class 0 OID 25821)
-- Dependencies: 228
-- Data for Name: customers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.customers (id, name, email, phone, created_at, updated_at, business_id, is_active, notes) FROM stdin;
2068	VANESA			2026-01-12 15:56:01.927372-03	2026-01-12 15:56:01.927372-03	1	t	\N
2069	VANESA			2026-01-12 15:56:01.930491-03	2026-01-12 15:56:01.930491-03	1	t	\N
2070	SILVIA			2026-01-12 15:56:01.931816-03	2026-01-12 15:56:01.931816-03	1	t	\N
2071	LILI			2026-01-12 15:56:01.934142-03	2026-01-12 15:56:01.934142-03	1	t	\N
2072	JONATAN			2026-01-12 15:56:01.936492-03	2026-01-12 15:56:01.936492-03	1	t	\N
2073	MATIAS			2026-01-12 15:56:01.938913-03	2026-01-12 15:56:01.938913-03	1	t	\N
2074	ANDREA			2026-01-12 15:56:01.941116-03	2026-01-12 15:56:01.941116-03	1	t	\N
2076	GRACIELA VECINA			2026-01-12 15:56:01.977058-03	2026-01-12 15:56:01.977058-03	1	t	\N
2077	ALEJO			2026-01-12 15:56:01.979073-03	2026-01-12 15:56:01.979073-03	1	t	\N
2078	PAOLA			2026-01-12 15:56:01.981009-03	2026-01-12 15:56:01.981009-03	1	t	\N
2079	MARIELA			2026-01-12 15:56:01.982955-03	2026-01-12 15:56:01.982955-03	1	t	\N
2080	HILDA			2026-01-12 15:56:01.985171-03	2026-01-12 15:56:01.985171-03	1	t	\N
2081	DORA			2026-01-12 15:56:01.987225-03	2026-01-12 15:56:01.987225-03	1	t	\N
2082	DON JUAN			2026-01-12 15:56:01.988906-03	2026-01-12 15:56:01.988906-03	1	t	\N
2083	LITO			2026-01-12 15:56:01.990415-03	2026-01-12 15:56:01.990415-03	1	t	\N
2084	SANTI PILAR			2026-01-12 15:56:01.991687-03	2026-01-12 15:56:01.991687-03	1	t	\N
2085	BIANCA			2026-01-12 15:56:01.992912-03	2026-01-12 15:56:01.992912-03	1	t	\N
2086	GISELA			2026-01-12 15:56:01.994207-03	2026-01-12 15:56:01.994207-03	1	t	\N
2087	RUBEN LOPEZ			2026-01-12 15:56:01.995714-03	2026-01-12 15:56:01.995714-03	1	t	\N
2088	PAOLA VILLAGRA			2026-01-12 15:56:01.997219-03	2026-01-12 15:56:01.997219-03	1	t	\N
2089	JOSE POLICIA			2026-01-12 15:56:01.99861-03	2026-01-12 15:56:01.99861-03	1	t	\N
2090	MICA			2026-01-12 15:56:02.000028-03	2026-01-12 15:56:02.000028-03	1	t	\N
2091	PROFESOR			2026-01-12 15:56:02.001515-03	2026-01-12 15:56:02.001515-03	1	t	\N
2093	DANIELA			2026-01-12 15:56:02.004326-03	2026-01-12 15:56:02.004326-03	1	t	\N
2094	MELISA			2026-01-12 15:56:02.005862-03	2026-01-12 15:56:02.005862-03	1	t	\N
2095	FRANCO			2026-01-12 15:56:02.007578-03	2026-01-12 15:56:02.007578-03	1	t	\N
2096	NICO LOPEZ			2026-01-12 15:56:02.009242-03	2026-01-12 15:56:02.009242-03	1	t	\N
2097	MELINA			2026-01-12 15:56:02.011017-03	2026-01-12 15:56:02.011017-03	1	t	\N
2098	NORMA PIZA			2026-01-12 15:56:02.012542-03	2026-01-12 15:56:02.012542-03	1	t	\N
2099	WILLIAM			2026-01-12 15:56:02.013889-03	2026-01-12 15:56:02.013889-03	1	t	\N
2100	ARIEL LEPRO			2026-01-12 15:56:02.015362-03	2026-01-12 15:56:02.015362-03	1	t	\N
2101	YONI VELAZQUEZ			2026-01-12 15:56:02.016908-03	2026-01-12 15:56:02.016908-03	1	t	\N
2102	JOSE JUAREZ			2026-01-12 15:56:02.018493-03	2026-01-12 15:56:02.018493-03	1	t	\N
2103	ELIANA ARIEL			2026-01-12 15:56:02.019904-03	2026-01-12 15:56:02.019904-03	1	t	\N
2104	PSICOLOGO			2026-01-12 15:56:02.021288-03	2026-01-12 15:56:02.021288-03	1	t	\N
2105	NANCI			2026-01-12 15:56:02.022739-03	2026-01-12 15:56:02.022739-03	1	t	\N
2106	CINTIA			2026-01-12 15:56:02.023957-03	2026-01-12 15:56:02.023957-03	1	t	\N
2107	MOTO AMARILLA			2026-01-12 15:56:02.025187-03	2026-01-12 15:56:02.025187-03	1	t	\N
2108	PABLITO			2026-01-12 15:56:02.026712-03	2026-01-12 15:56:02.026712-03	1	t	\N
2109	POLI SERGIO			2026-01-12 15:56:02.028331-03	2026-01-12 15:56:02.028331-03	1	t	\N
2110	MELINA			2026-01-12 15:56:02.030774-03	2026-01-12 15:56:02.030774-03	1	t	\N
2111	SABRINA			2026-01-12 15:56:02.033959-03	2026-01-12 15:56:02.033959-03	1	t	\N
2112	DAI			2026-01-12 15:56:02.036549-03	2026-01-12 15:56:02.036549-03	1	t	\N
2113	MARU			2026-01-12 15:56:02.038858-03	2026-01-12 15:56:02.038858-03	1	t	\N
2114	JOSE PABLITO			2026-01-12 15:56:02.040792-03	2026-01-12 15:56:02.040792-03	1	t	\N
2115	EVANGELINA			2026-01-12 15:56:02.042258-03	2026-01-12 15:56:02.042258-03	1	t	\N
2116	PATRICIA PELO CORTO			2026-01-12 15:56:02.043617-03	2026-01-12 15:56:02.043617-03	1	t	\N
2117	DANI NICO			2026-01-12 15:56:02.045119-03	2026-01-12 15:56:02.045119-03	1	t	\N
2118	ROBERTO			2026-01-12 15:56:02.046244-03	2026-01-12 15:56:02.046244-03	1	t	\N
2119	GLORIA ARGENTINA			2026-01-12 15:56:02.047502-03	2026-01-12 15:56:02.047502-03	1	t	\N
2120	ALEJANDRA CORRIENTE			2026-01-12 15:56:02.048968-03	2026-01-12 15:56:02.048968-03	1	t	\N
2121	RUBEN PARRILLA			2026-01-12 15:56:02.050143-03	2026-01-12 15:56:02.050143-03	1	t	\N
2122	MINGO ACOSTA			2026-01-12 15:56:02.051161-03	2026-01-12 15:56:02.051161-03	1	t	\N
2123	ALICIA			2026-01-12 15:56:02.052099-03	2026-01-12 15:56:02.052099-03	1	t	\N
2124	BEATRIZ CORRIENTES			2026-01-12 15:56:02.052988-03	2026-01-12 15:56:02.052988-03	1	t	\N
2125	PATRICIA FERNDEZ			2026-01-12 15:56:02.053909-03	2026-01-12 15:56:02.053909-03	1	t	\N
2126	JUAN MAYA			2026-01-12 15:56:02.054836-03	2026-01-12 15:56:02.054836-03	1	t	\N
2127	NICO PAN			2026-01-12 15:56:02.055865-03	2026-01-12 15:56:02.055865-03	1	t	\N
2128	GERARD FERREIRA			2026-01-12 15:56:02.056943-03	2026-01-12 15:56:02.056943-03	1	t	\N
2129	EVE			2026-01-12 15:56:02.059289-03	2026-01-12 15:56:02.059289-03	1	t	\N
2130	MARI BOCHI			2026-01-12 15:56:02.061619-03	2026-01-12 15:56:02.061619-03	1	t	\N
2131	NORMA			2026-01-12 15:56:02.063357-03	2026-01-12 15:56:02.063357-03	1	t	\N
2132	BENJA			2026-01-12 15:56:02.064579-03	2026-01-12 15:56:02.064579-03	1	t	\N
2133	ESTELA BENJA			2026-01-12 15:56:02.065896-03	2026-01-12 15:56:02.065896-03	1	t	\N
2134	MIGEL ALICIA			2026-01-12 15:56:02.067842-03	2026-01-12 15:56:02.067842-03	1	t	\N
2135	FABIO			2026-01-12 15:56:02.069786-03	2026-01-12 15:56:02.069786-03	1	t	\N
2136	FRANCISCO			2026-01-12 15:56:02.071699-03	2026-01-12 15:56:02.071699-03	1	t	\N
2137	MICAELA ELI			2026-01-12 15:56:02.073217-03	2026-01-12 15:56:02.073217-03	1	t	\N
2138	CELESTE JONATAN			2026-01-12 15:56:02.074496-03	2026-01-12 15:56:02.074496-03	1	t	\N
2139	DANIEL MELISA			2026-01-12 15:56:02.075635-03	2026-01-12 15:56:02.075635-03	1	t	\N
2140	GONZALO MARTIN			2026-01-12 15:56:02.076797-03	2026-01-12 15:56:02.076797-03	1	t	\N
2141	FERNANDO			2026-01-12 15:56:02.078252-03	2026-01-12 15:56:02.078252-03	1	t	\N
2142	LEO GORRITA			2026-01-12 15:56:02.080227-03	2026-01-12 15:56:02.080227-03	1	t	\N
2143	TORETO			2026-01-12 15:56:02.081955-03	2026-01-12 15:56:02.081955-03	1	t	\N
2144	FLAQUITO EN MOTO			2026-01-12 15:56:02.084423-03	2026-01-12 15:56:02.084423-03	1	t	\N
2145	DIEGO VIOLIN			2026-01-12 15:56:02.086543-03	2026-01-12 15:56:02.086543-03	1	t	\N
2146	BARBA ROJA			2026-01-12 15:56:02.088524-03	2026-01-12 15:56:02.088524-03	1	t	\N
2147	FEDERICO			2026-01-12 15:56:02.090068-03	2026-01-12 15:56:02.090068-03	1	t	\N
2148	DAVID LEPRO			2026-01-12 15:56:02.091479-03	2026-01-12 15:56:02.091479-03	1	t	\N
2149	MIGELO LEPRO			2026-01-12 15:56:02.093032-03	2026-01-12 15:56:02.093032-03	1	t	\N
2150	TOMAS			2026-01-12 15:56:02.095057-03	2026-01-12 15:56:02.095057-03	1	t	\N
2151	MAURI			2026-01-12 15:56:02.097131-03	2026-01-12 15:56:02.097131-03	1	t	\N
2152	AYELEN HNA DE MARTIN			2026-01-12 15:56:02.099253-03	2026-01-12 15:56:02.099253-03	1	t	\N
2153	SOL ACOSTA			2026-01-12 15:56:02.101253-03	2026-01-12 15:56:02.101253-03	1	t	\N
2154	SALIM			2026-01-12 15:56:02.103233-03	2026-01-12 15:56:02.103233-03	1	t	\N
2155	CELIA			2026-01-12 15:56:02.10518-03	2026-01-12 15:56:02.10518-03	1	t	\N
2156	ADRIAN			2026-01-12 15:56:02.106948-03	2026-01-12 15:56:02.106948-03	1	t	\N
2157	HUEVERO DIEGO			2026-01-12 15:56:02.109231-03	2026-01-12 15:56:02.109231-03	1	t	\N
2158	PIKI			2026-01-12 15:56:02.111065-03	2026-01-12 15:56:02.111065-03	1	t	\N
2159	MIGEL ISOLINA			2026-01-12 15:56:02.112833-03	2026-01-12 15:56:02.112833-03	1	t	\N
2160	ROMI VALIENTE			2026-01-12 15:56:02.114697-03	2026-01-12 15:56:02.114697-03	1	t	\N
2161	ECTOR			2026-01-12 15:56:02.11654-03	2026-01-12 15:56:02.11654-03	1	t	\N
2162	CARINA LUTY			2026-01-12 15:56:02.11816-03	2026-01-12 15:56:02.11816-03	1	t	\N
2163	ERICK			2026-01-12 15:56:02.119502-03	2026-01-12 15:56:02.119502-03	1	t	\N
2164	MARTIN			2026-01-12 15:56:02.120788-03	2026-01-12 15:56:02.120788-03	1	t	\N
2165	EDUARDO			2026-01-12 15:56:02.122196-03	2026-01-12 15:56:02.122196-03	1	t	\N
2166	ROCIO JASMIN			2026-01-12 15:56:02.12353-03	2026-01-12 15:56:02.12353-03	1	t	\N
2167	LORE PXP			2026-01-12 15:56:02.124785-03	2026-01-12 15:56:02.124785-03	1	t	\N
2168	CAMILO			2026-01-12 15:56:02.126534-03	2026-01-12 15:56:02.126534-03	1	t	\N
2169	MARTIN VECINO			2026-01-12 15:56:02.128116-03	2026-01-12 15:56:02.128116-03	1	t	\N
2170	NICO MOROCHITO			2026-01-12 15:56:02.129575-03	2026-01-12 15:56:02.129575-03	1	t	\N
2171	TOBIAS			2026-01-12 15:56:02.132178-03	2026-01-12 15:56:02.132178-03	1	t	\N
2172	ESTEFANIA			2026-01-12 15:56:02.13386-03	2026-01-12 15:56:02.13386-03	1	t	\N
2173	ARIEL LOPEZ			2026-01-12 15:56:02.135263-03	2026-01-12 15:56:02.135263-03	1	t	\N
2174	ANA			2026-01-12 15:56:02.13685-03	2026-01-12 15:56:02.13685-03	1	t	\N
2175	GLADIS			2026-01-12 15:56:02.138295-03	2026-01-12 15:56:02.138295-03	1	t	\N
2176	LORENA LENCINA			2026-01-12 15:56:02.139745-03	2026-01-12 15:56:02.139745-03	1	t	\N
2177	VALEVTIN MARIAN			2026-01-12 15:56:02.141241-03	2026-01-12 15:56:02.141241-03	1	t	\N
2178	ROLON			2026-01-12 15:56:02.143066-03	2026-01-12 15:56:02.143066-03	1	t	\N
2179	SERGIO DUARTERO			2026-01-12 15:56:02.144631-03	2026-01-12 15:56:02.144631-03	1	t	\N
2180	ISOLINA			2026-01-12 15:56:02.146047-03	2026-01-12 15:56:02.146047-03	1	t	\N
2181	ANTONELA GIMENEZ			2026-01-12 15:56:02.147531-03	2026-01-12 15:56:02.147531-03	1	t	\N
2182	DANIEL BARCELONE			2026-01-12 15:56:02.148867-03	2026-01-12 15:56:02.148867-03	1	t	\N
2183	MIGELITO			2026-01-12 15:56:02.150087-03	2026-01-12 15:56:02.150087-03	1	t	\N
2184	NADIA TOBA			2026-01-12 15:56:02.151411-03	2026-01-12 15:56:02.151411-03	1	t	\N
2185	MARCOS			2026-01-12 15:56:02.15288-03	2026-01-12 15:56:02.15288-03	1	t	\N
2186	CAMI			2026-01-12 15:56:02.154863-03	2026-01-12 15:56:02.154863-03	1	t	\N
2187	PABLO EZEQUIEL			2026-01-12 15:56:02.157476-03	2026-01-12 15:56:02.157476-03	1	t	\N
2188	REBECA			2026-01-12 15:56:02.159731-03	2026-01-12 15:56:02.159731-03	1	t	\N
2189	MAXI			2026-01-12 15:56:02.16185-03	2026-01-12 15:56:02.16185-03	1	t	\N
2190	ALEJO			2026-01-12 15:56:02.163637-03	2026-01-12 15:56:02.163637-03	1	t	\N
2191	HERNAN ESQUINA			2026-01-12 15:56:02.165323-03	2026-01-12 15:56:02.165323-03	1	t	\N
2192	JIULIANA			2026-01-12 15:56:02.16689-03	2026-01-12 15:56:02.16689-03	1	t	\N
2193	BROCHERO			2026-01-12 15:56:02.168496-03	2026-01-12 15:56:02.168496-03	1	t	\N
2194	GONZALO MARTIN			2026-01-12 15:56:02.169993-03	2026-01-12 15:56:02.169993-03	1	t	\N
2195	ALCIRA			2026-01-12 15:56:02.171552-03	2026-01-12 15:56:02.171552-03	1	t	\N
2196	BELEN			2026-01-12 15:56:02.173095-03	2026-01-12 15:56:02.173095-03	1	t	\N
2197	MARIANA AYELEN			2026-01-12 15:56:02.174575-03	2026-01-12 15:56:02.174575-03	1	t	\N
2198	OBREGON FRANCO			2026-01-12 15:56:02.176086-03	2026-01-12 15:56:02.176086-03	1	t	\N
2199	FRANCO PATTONE			2026-01-12 15:56:02.177498-03	2026-01-12 15:56:02.177498-03	1	t	\N
2200	GONZALO			2026-01-12 15:56:02.219072-03	2026-01-12 15:56:02.219072-03	1	t	\N
2201	GRA HECTR			2026-01-12 15:56:02.220934-03	2026-01-12 15:56:02.220934-03	1	t	\N
2202	PAULA			2026-01-12 15:56:02.222825-03	2026-01-12 15:56:02.222825-03	1	t	\N
2203	ALEXIS			2026-01-12 15:56:02.224621-03	2026-01-12 15:56:02.224621-03	1	t	\N
2204	ESTELA PILAR			2026-01-12 15:56:02.226529-03	2026-01-12 15:56:02.226529-03	1	t	\N
2205	RODRIGO			2026-01-12 15:56:02.228315-03	2026-01-12 15:56:02.228315-03	1	t	\N
2206	ABRIL			2026-01-12 15:56:02.229965-03	2026-01-12 15:56:02.229965-03	1	t	\N
2207	MARIANO COLECTIVERO			2026-01-12 15:56:02.231601-03	2026-01-12 15:56:02.231601-03	1	t	\N
2208	ARIEL CAMIONETA			2026-01-12 15:56:02.233377-03	2026-01-12 15:56:02.233377-03	1	t	\N
2209	DANA NICOL			2026-01-12 15:56:02.235365-03	2026-01-12 15:56:02.235365-03	1	t	\N
2210	GABI			2026-01-12 15:56:02.237088-03	2026-01-12 15:56:02.237088-03	1	t	\N
2211	GRISELDA			2026-01-12 15:56:02.23892-03	2026-01-12 15:56:02.23892-03	1	t	\N
2212	NATALIA			2026-01-12 15:56:02.240798-03	2026-01-12 15:56:02.240798-03	1	t	\N
2213	DAMIAN			2026-01-12 15:56:02.24265-03	2026-01-12 15:56:02.24265-03	1	t	\N
2214	LUCIANA			2026-01-12 15:56:02.244424-03	2026-01-12 15:56:02.244424-03	1	t	\N
2215	FLORENCIA			2026-01-12 15:56:02.246213-03	2026-01-12 15:56:02.246213-03	1	t	\N
2216	MILAGROS			2026-01-12 15:56:02.248001-03	2026-01-12 15:56:02.248001-03	1	t	\N
2218	PRICILA			2026-01-12 15:56:02.251659-03	2026-01-12 15:56:02.251659-03	1	t	\N
2219	MIGUEL LEPRO PADRE			2026-01-12 15:56:02.25333-03	2026-01-12 15:56:02.25333-03	1	t	\N
2220	BRAIAN NICOLAS			2026-01-12 15:56:02.254962-03	2026-01-12 15:56:02.254962-03	1	t	\N
2221	GERMAN CARPINTERO			2026-01-12 15:56:02.256591-03	2026-01-12 15:56:02.256591-03	1	t	\N
2222	CHICHO			2026-01-12 15:56:02.258461-03	2026-01-12 15:56:02.258461-03	1	t	\N
2223	ROSA SANCHEZ			2026-01-12 15:56:02.260093-03	2026-01-12 15:56:02.260093-03	1	t	\N
2224	FLORENCIA QUIÑONES			2026-01-12 15:56:02.26168-03	2026-01-12 15:56:02.26168-03	1	t	\N
2225	BRAIAN VILLAGRAM			2026-01-12 15:56:02.26326-03	2026-01-12 15:56:02.26326-03	1	t	\N
2226	ZAHIARA LEIVA			2026-01-12 15:56:02.264845-03	2026-01-12 15:56:02.264845-03	1	t	\N
2227	MARIANO MARTIN			2026-01-12 15:56:02.266509-03	2026-01-12 15:56:02.266509-03	1	t	\N
2228	ZULMA			2026-01-12 15:56:02.268169-03	2026-01-12 15:56:02.268169-03	1	t	\N
2229	ALEJANDO ELIAS			2026-01-12 15:56:02.269788-03	2026-01-12 15:56:02.269788-03	1	t	\N
2230	FERNANDA			2026-01-12 15:56:02.271373-03	2026-01-12 15:56:02.271373-03	1	t	\N
2231	SILVIA			2026-01-12 15:56:02.272911-03	2026-01-12 15:56:02.272911-03	1	t	\N
2232	NATALIA HIRMA			2026-01-12 15:56:02.274496-03	2026-01-12 15:56:02.274496-03	1	t	\N
2233	MATAS BROCHERO			2026-01-12 15:56:02.276121-03	2026-01-12 15:56:02.276121-03	1	t	\N
2234	LEO MARTIN			2026-01-12 15:56:02.277746-03	2026-01-12 15:56:02.277746-03	1	t	\N
2235	JUAN CARLO			2026-01-12 15:56:02.279372-03	2026-01-12 15:56:02.279372-03	1	t	\N
2236	ABRIL PARREÑO			2026-01-12 15:56:02.281096-03	2026-01-12 15:56:02.281096-03	1	t	\N
2237	YOANA			2026-01-12 15:56:02.282874-03	2026-01-12 15:56:02.282874-03	1	t	\N
2238	CHECO			2026-01-12 15:56:02.28449-03	2026-01-12 15:56:02.28449-03	1	t	\N
2239	PATRICIA SEGOVIA			2026-01-12 15:56:02.286142-03	2026-01-12 15:56:02.286142-03	1	t	\N
2240	FLORENCIA LUCAS			2026-01-12 15:56:02.287905-03	2026-01-12 15:56:02.287905-03	1	t	\N
2241	PIZERO			2026-01-12 15:56:02.289689-03	2026-01-12 15:56:02.289689-03	1	t	\N
2242	SOFIA			2026-01-12 15:56:02.291436-03	2026-01-12 15:56:02.291436-03	1	t	\N
2243	LEO OCHOA			2026-01-12 15:56:02.293365-03	2026-01-12 15:56:02.293365-03	1	t	\N
2244	ANTONIO CARRIZO			2026-01-12 15:56:02.295191-03	2026-01-12 15:56:02.295191-03	1	t	\N
2245	YESI			2026-01-12 15:56:02.296956-03	2026-01-12 15:56:02.296956-03	1	t	\N
2246	YOANA NEIRA			2026-01-12 15:56:02.298786-03	2026-01-12 15:56:02.298786-03	1	t	\N
2247	XIOMARA			2026-01-12 15:56:02.300936-03	2026-01-12 15:56:02.300936-03	1	t	\N
2248	CHOCO			2026-01-12 15:56:02.302936-03	2026-01-12 15:56:02.302936-03	1	t	\N
2249	GRACIELA EN FRENTE			2026-01-12 15:56:02.304836-03	2026-01-12 15:56:02.304836-03	1	t	\N
2250	ROBERTO TALLER			2026-01-12 15:56:02.306775-03	2026-01-12 15:56:02.306775-03	1	t	\N
2251	JENIFER			2026-01-12 15:56:02.308867-03	2026-01-12 15:56:02.308867-03	1	t	\N
2252	ESTEFANIA PALACIOS			2026-01-12 15:56:02.310815-03	2026-01-12 15:56:02.310815-03	1	t	\N
2253	MARINA GUZMAN			2026-01-12 15:56:02.31257-03	2026-01-12 15:56:02.31257-03	1	t	\N
2254	BRENDA CORTESI			2026-01-12 15:56:02.314442-03	2026-01-12 15:56:02.314442-03	1	t	\N
2255	VALENTINO OLEINIK			2026-01-12 15:56:02.316059-03	2026-01-12 15:56:02.316059-03	1	t	\N
2256	LAUTI			2026-01-12 15:56:02.317886-03	2026-01-12 15:56:02.317886-03	1	t	\N
2257	LUCIANA IZNARDO			2026-01-12 15:56:02.319789-03	2026-01-12 15:56:02.319789-03	1	t	\N
2258	LUIS ARANDA			2026-01-12 15:56:02.321829-03	2026-01-12 15:56:02.321829-03	1	t	\N
2259	MARIA DE LOS ANGELES			2026-01-12 15:56:02.324004-03	2026-01-12 15:56:02.324004-03	1	t	\N
2260	YOANA FIGEROA			2026-01-12 15:56:02.325968-03	2026-01-12 15:56:02.325968-03	1	t	\N
2261	DAVID ABREGU			2026-01-12 15:56:02.327939-03	2026-01-12 15:56:02.327939-03	1	t	\N
2263	MATIAS COSTA			2026-01-12 15:56:02.331897-03	2026-01-12 15:56:02.331897-03	1	t	\N
2264	FRANCO MINUTO			2026-01-12 15:56:02.33387-03	2026-01-12 15:56:02.33387-03	1	t	\N
2265	JUAN PABLO			2026-01-12 15:56:02.336243-03	2026-01-12 15:56:02.336243-03	1	t	\N
2266	CAMILA HNA DE CER			2026-01-12 15:56:02.338297-03	2026-01-12 15:56:02.338297-03	1	t	\N
2267	ALAN VARBUENA			2026-01-12 15:56:02.340301-03	2026-01-12 15:56:02.340301-03	1	t	\N
2268	MIRTA			2026-01-12 15:56:02.377668-03	2026-01-12 15:56:02.377668-03	1	t	\N
2269	LAUTARO			2026-01-12 15:56:02.379559-03	2026-01-12 15:56:02.379559-03	1	t	\N
2270	ROCIO ANGELES			2026-01-12 15:56:02.38152-03	2026-01-12 15:56:02.38152-03	1	t	\N
2271	NOELIA MONZON			2026-01-12 15:56:02.383507-03	2026-01-12 15:56:02.383507-03	1	t	\N
2272	MAIA			2026-01-12 15:56:02.385478-03	2026-01-12 15:56:02.385478-03	1	t	\N
2273	DIAS ALICIA			2026-01-12 15:56:02.38733-03	2026-01-12 15:56:02.38733-03	1	t	\N
2274	ALEJANDRO DOSANTOS			2026-01-12 15:56:02.389484-03	2026-01-12 15:56:02.389484-03	1	t	\N
2275	JORGELINA MARRESES			2026-01-12 15:56:02.391679-03	2026-01-12 15:56:02.391679-03	1	t	\N
2276	CINTIA HERNANDES			2026-01-12 15:56:02.393799-03	2026-01-12 15:56:02.393799-03	1	t	\N
2277	NICO BAUTILLAR			2026-01-12 15:56:02.395729-03	2026-01-12 15:56:02.395729-03	1	t	\N
2278	YISELA CORONEL			2026-01-12 15:56:02.397848-03	2026-01-12 15:56:02.397848-03	1	t	\N
2279	PERLA GONZALEZ			2026-01-12 15:56:02.400066-03	2026-01-12 15:56:02.400066-03	1	t	\N
2280	NAHUEL ERRERA			2026-01-12 15:56:02.402265-03	2026-01-12 15:56:02.402265-03	1	t	\N
2281	LEGUI			2026-01-12 15:56:02.404402-03	2026-01-12 15:56:02.404402-03	1	t	\N
2282	ROBERTO LOPEZ			2026-01-12 15:56:02.406339-03	2026-01-12 15:56:02.406339-03	1	t	\N
2283	SUSAN			2026-01-12 15:56:02.408228-03	2026-01-12 15:56:02.408228-03	1	t	\N
2284	MARTIN			2026-01-12 15:56:02.409912-03	2026-01-12 15:56:02.409912-03	1	t	\N
2285	FERNANDA GONZALO			2026-01-12 15:56:02.411695-03	2026-01-12 15:56:02.411695-03	1	t	\N
2286	PABLO MALVINA			2026-01-12 15:56:02.413703-03	2026-01-12 15:56:02.413703-03	1	t	\N
2287	CAROLINA			2026-01-12 15:56:02.415849-03	2026-01-12 15:56:02.415849-03	1	t	\N
2288	JULIO			2026-01-12 15:56:02.418521-03	2026-01-12 15:56:02.418521-03	1	t	\N
2289	AMIGO RICARDO			2026-01-12 15:56:02.420674-03	2026-01-12 15:56:02.420674-03	1	t	\N
2290	ADRIAN PETISO			2026-01-12 15:56:02.422488-03	2026-01-12 15:56:02.422488-03	1	t	\N
2291	NICO SAUCEDO			2026-01-12 15:56:02.424283-03	2026-01-12 15:56:02.424283-03	1	t	\N
2292	DAY			2026-01-12 15:56:02.426581-03	2026-01-12 15:56:02.426581-03	1	t	\N
2293	JULIO ALEJO MECANICO			2026-01-12 15:56:02.428671-03	2026-01-12 15:56:02.428671-03	1	t	\N
2294	MARIANO BOGADO			2026-01-12 15:56:02.43075-03	2026-01-12 15:56:02.43075-03	1	t	\N
2295	FLORENCIA OLIVERA			2026-01-12 15:56:02.445786-03	2026-01-12 15:56:02.445786-03	1	t	\N
2296	A			2026-01-12 15:56:02.447723-03	2026-01-12 15:56:02.447723-03	1	t	\N
2297	LITO MAMA			2026-01-12 15:56:02.449531-03	2026-01-12 15:56:02.449531-03	1	t	\N
2298	SILVANA VILLORDO			2026-01-12 15:56:02.451404-03	2026-01-12 15:56:02.451404-03	1	t	\N
2299	DON  JUAN  PARAGUA			2026-01-12 15:56:02.453635-03	2026-01-12 15:56:02.453635-03	1	t	\N
2300	PAULA DE DIEGO			2026-01-12 15:56:02.457235-03	2026-01-12 15:56:02.457235-03	1	t	\N
2301	JAVIER			2026-01-12 15:56:02.45983-03	2026-01-12 15:56:02.45983-03	1	t	\N
2302	NELI			2026-01-12 15:56:02.462443-03	2026-01-12 15:56:02.462443-03	1	t	\N
2303	MAMA DE LAUTI			2026-01-12 15:56:02.464619-03	2026-01-12 15:56:02.464619-03	1	t	\N
2304	GOZALO AZOFRA			2026-01-12 15:56:02.466651-03	2026-01-12 15:56:02.466651-03	1	t	\N
2305	🐻 OSO			2026-01-12 15:56:02.468878-03	2026-01-12 15:56:02.468878-03	1	t	\N
2306	SULMA HERNANDEZ			2026-01-12 15:56:02.471059-03	2026-01-12 15:56:02.471059-03	1	t	\N
2307	NATI MARTIN			2026-01-12 15:56:02.473623-03	2026-01-12 15:56:02.473623-03	1	t	\N
2308	DOMINGA			2026-01-12 15:56:02.47584-03	2026-01-12 15:56:02.47584-03	1	t	\N
2309	LEO VENEGAS			2026-01-12 15:56:02.478125-03	2026-01-12 15:56:02.478125-03	1	t	\N
2310	GRACIELA FERNANDES			2026-01-12 15:56:02.480187-03	2026-01-12 15:56:02.480187-03	1	t	\N
2311	PATRICIA HERNAN			2026-01-12 15:56:02.482081-03	2026-01-12 15:56:02.482081-03	1	t	\N
2312	EVE			2026-01-12 15:56:02.484114-03	2026-01-12 15:56:02.484114-03	1	t	\N
2313	LUCAS			2026-01-12 15:56:02.486006-03	2026-01-12 15:56:02.486006-03	1	t	\N
2314	ISABEL			2026-01-12 15:56:02.487821-03	2026-01-12 15:56:02.487821-03	1	t	\N
2315	IVANA			2026-01-12 15:56:02.489528-03	2026-01-12 15:56:02.489528-03	1	t	\N
2316	EVE			2026-01-12 15:56:02.491406-03	2026-01-12 15:56:02.491406-03	1	t	\N
2317	RAMINGER			2026-01-12 15:56:02.493311-03	2026-01-12 15:56:02.493311-03	1	t	\N
2318	ROLON			2026-01-12 15:56:02.495074-03	2026-01-12 15:56:02.495074-03	1	t	\N
2319	NATALIA SALINAS			2026-01-12 15:56:02.496827-03	2026-01-12 15:56:02.496827-03	1	t	\N
2320	SILVINA LORENA ACOSTA			2026-01-12 15:56:02.498772-03	2026-01-12 15:56:02.498772-03	1	t	\N
2321	DAI SOBRINA			2026-01-12 15:56:02.500943-03	2026-01-12 15:56:02.500943-03	1	t	\N
2322	EMIR			2026-01-12 15:56:02.503134-03	2026-01-12 15:56:02.503134-03	1	t	\N
2323	CRISTIAN ROJAS MARIDO FE VANE			2026-01-12 15:56:02.504954-03	2026-01-12 15:56:02.504954-03	1	t	\N
2324	MELANI ROLDAN			2026-01-12 15:56:02.506625-03	2026-01-12 15:56:02.506625-03	1	t	\N
2325	HIJO DE LITO			2026-01-12 15:56:02.50844-03	2026-01-12 15:56:02.50844-03	1	t	\N
2326	MUJER DE HERNAN			2026-01-12 15:56:02.510287-03	2026-01-12 15:56:02.510287-03	1	t	\N
2327	BENJAMIN			2026-01-12 15:56:02.512253-03	2026-01-12 15:56:02.512253-03	1	t	\N
2328	ALONDRA			2026-01-12 15:56:02.5143-03	2026-01-12 15:56:02.5143-03	1	t	\N
2329	AAA			2026-01-12 15:56:02.550471-03	2026-01-12 15:56:02.550471-03	1	t	\N
2330	NICOL NOVERA			2026-01-12 15:56:02.55253-03	2026-01-12 15:56:02.55253-03	1	t	\N
2331	CLAUDIA AQUINO			2026-01-12 15:56:02.554597-03	2026-01-12 15:56:02.554597-03	1	t	\N
2332	LUCAS ARANDA			2026-01-12 15:56:02.556584-03	2026-01-12 15:56:02.556584-03	1	t	\N
2333	LAZARO ZIGARAN			2026-01-12 15:56:02.558754-03	2026-01-12 15:56:02.558754-03	1	t	\N
2334	EZEQUIEL OCHOA			2026-01-12 15:56:02.560693-03	2026-01-12 15:56:02.560693-03	1	t	\N
2335	GUADALUPE PXP			2026-01-12 15:56:02.562623-03	2026-01-12 15:56:02.562623-03	1	t	\N
2336	ESTEFANIA MANCUELLO			2026-01-12 15:56:02.564779-03	2026-01-12 15:56:02.564779-03	1	t	\N
2337	ANTOÑO FLORES			2026-01-12 15:56:02.567247-03	2026-01-12 15:56:02.567247-03	1	t	\N
2338	LAVADERO			2026-01-12 15:56:02.569285-03	2026-01-12 15:56:02.569285-03	1	t	\N
2339	LEONARDO QUIROGA			2026-01-12 15:56:02.571158-03	2026-01-12 15:56:02.571158-03	1	t	\N
2341	ERICA ACOSTA			2026-01-12 15:56:02.574804-03	2026-01-12 15:56:02.574804-03	1	t	\N
2342	HILD			2026-01-12 15:56:02.576667-03	2026-01-12 15:56:02.576667-03	1	t	\N
2343	PRICILA ALARCON			2026-01-12 15:56:02.578353-03	2026-01-12 15:56:02.578353-03	1	t	\N
2344	MARIA BARCELONE			2026-01-12 15:56:02.580041-03	2026-01-12 15:56:02.580041-03	1	t	\N
2345	LAURA TOLOT			2026-01-12 15:56:02.581834-03	2026-01-12 15:56:02.581834-03	1	t	\N
2346	MAXIMILIANO SALVINI			2026-01-12 15:56:02.58376-03	2026-01-12 15:56:02.58376-03	1	t	\N
2347	MAR.FRANK			2026-01-12 15:56:02.585689-03	2026-01-12 15:56:02.585689-03	1	t	\N
2348	DORA			2026-01-12 15:56:02.587465-03	2026-01-12 15:56:02.587465-03	1	t	\N
2349	HIJA DE LA QUE VIENE A COMPRAR ALA FAM			2026-01-12 15:56:02.589469-03	2026-01-12 15:56:02.589469-03	1	t	\N
2350	EVE			2026-01-12 15:56:02.591436-03	2026-01-12 15:56:02.591436-03	1	t	\N
2351	RAMIRO LEPRO			2026-01-12 15:56:02.593447-03	2026-01-12 15:56:02.593447-03	1	t	\N
2352	DIEGO ENFRENTE			2026-01-12 15:56:02.595547-03	2026-01-12 15:56:02.595547-03	1	t	\N
2353	NORMA BEBER			2026-01-12 15:56:02.597416-03	2026-01-12 15:56:02.597416-03	1	t	\N
2354	CELESTE FAURE			2026-01-12 15:56:02.599319-03	2026-01-12 15:56:02.599319-03	1	t	\N
2355	ROXANA			2026-01-12 15:56:02.600976-03	2026-01-12 15:56:02.600976-03	1	t	\N
2356	ALEJANDRO ANGEL			2026-01-12 15:56:02.602615-03	2026-01-12 15:56:02.602615-03	1	t	\N
2357	MAXI LOPEZ			2026-01-12 15:56:02.60429-03	2026-01-12 15:56:02.60429-03	1	t	\N
2358	HIJA DE CORRIENTE			2026-01-12 15:56:02.605919-03	2026-01-12 15:56:02.605919-03	1	t	\N
2359	HERMANA DE DAMIAN			2026-01-12 15:56:02.607709-03	2026-01-12 15:56:02.607709-03	1	t	\N
2360	FERNANDO GENTILE			2026-01-12 15:56:02.609478-03	2026-01-12 15:56:02.609478-03	1	t	\N
2361	MAXI CHOCOVAR			2026-01-12 15:56:02.611203-03	2026-01-12 15:56:02.611203-03	1	t	\N
2362	MARIEL			2026-01-12 15:56:02.612855-03	2026-01-12 15:56:02.612855-03	1	t	\N
2363	CHURROS			2026-01-12 15:56:02.614566-03	2026-01-12 15:56:02.614566-03	1	t	\N
2364	ELIAS FERREYRA			2026-01-12 15:56:02.616451-03	2026-01-12 15:56:02.616451-03	1	t	\N
2365	KATHERINE SARABIA			2026-01-12 15:56:02.618136-03	2026-01-12 15:56:02.618136-03	1	t	\N
2366	GERARDO			2026-01-12 15:56:02.619818-03	2026-01-12 15:56:02.619818-03	1	t	\N
2367	ALVARO VIDELA			2026-01-12 15:56:02.621701-03	2026-01-12 15:56:02.621701-03	1	t	\N
2368	SEBASTIAN			2026-01-12 15:56:02.647801-03	2026-01-12 15:56:02.647801-03	1	t	\N
2369	SUSAN			2026-01-12 15:56:02.650218-03	2026-01-12 15:56:02.650218-03	1	t	\N
2370	VANESA BARRIONUEVO			2026-01-12 15:56:02.652309-03	2026-01-12 15:56:02.652309-03	1	t	\N
2371	YOANA OCHOA			2026-01-12 15:56:02.654539-03	2026-01-12 15:56:02.654539-03	1	t	\N
2372	DANIEL ALEGRE			2026-01-12 15:56:02.656475-03	2026-01-12 15:56:02.656475-03	1	t	\N
2373	DIEGO ABREGU			2026-01-12 15:56:02.658311-03	2026-01-12 15:56:02.658311-03	1	t	\N
2374	RODRIGO ALEJANDRO			2026-01-12 15:56:02.660165-03	2026-01-12 15:56:02.660165-03	1	t	\N
2375	PILCHALF			2026-01-12 15:56:02.662-03	2026-01-12 15:56:02.662-03	1	t	\N
2376	MAXIMILIANO BROCHERO			2026-01-12 15:56:02.66367-03	2026-01-12 15:56:02.66367-03	1	t	\N
2377	LAS NENAS			2026-01-12 15:56:02.665324-03	2026-01-12 15:56:02.665324-03	1	t	\N
2378	FLOR ACOSTA			2026-01-12 15:56:02.666948-03	2026-01-12 15:56:02.666948-03	1	t	\N
2379	LORENA MASCOLO			2026-01-12 15:56:02.668621-03	2026-01-12 15:56:02.668621-03	1	t	\N
2380	CELESTE BENITEZ			2026-01-12 15:56:02.670418-03	2026-01-12 15:56:02.670418-03	1	t	\N
2381	JULI ACOSTA			2026-01-12 15:56:02.672639-03	2026-01-12 15:56:02.672639-03	1	t	\N
2382	CAMILA QUIROGA			2026-01-12 15:56:02.674577-03	2026-01-12 15:56:02.674577-03	1	t	\N
2383	KEVIN			2026-01-12 15:56:02.676415-03	2026-01-12 15:56:02.676415-03	1	t	\N
2384	MARU			2026-01-12 15:56:02.678385-03	2026-01-12 15:56:02.678385-03	1	t	\N
2385	ANDREA MENDOZA			2026-01-12 15:56:02.680189-03	2026-01-12 15:56:02.680189-03	1	t	\N
2386	JUAQUIN FERNANDEZ			2026-01-12 15:56:02.68219-03	2026-01-12 15:56:02.68219-03	1	t	\N
2387	MARIO BENITEZ			2026-01-12 15:56:02.684238-03	2026-01-12 15:56:02.684238-03	1	t	\N
2388	NADIA VERA			2026-01-12 15:56:02.686286-03	2026-01-12 15:56:02.686286-03	1	t	\N
2389	ANYI			2026-01-12 15:56:02.68815-03	2026-01-12 15:56:02.68815-03	1	t	\N
2390	NUEMI RAMIREZ			2026-01-12 15:56:02.69048-03	2026-01-12 15:56:02.69048-03	1	t	\N
2391	KAREN MARTINEZ			2026-01-12 15:56:02.692525-03	2026-01-12 15:56:02.692525-03	1	t	\N
2392	MATIAS PIZERO			2026-01-12 15:56:02.694404-03	2026-01-12 15:56:02.694404-03	1	t	\N
2393	PAO DAVID			2026-01-12 15:56:02.696342-03	2026-01-12 15:56:02.696342-03	1	t	\N
2394	EMANUEL SOLANO			2026-01-12 15:56:02.698354-03	2026-01-12 15:56:02.698354-03	1	t	\N
2395	DELCIA VILLALBA			2026-01-12 15:56:02.700522-03	2026-01-12 15:56:02.700522-03	1	t	\N
2396	GLADIS LUYSA VAZQUEZ			2026-01-12 15:56:02.702839-03	2026-01-12 15:56:02.702839-03	1	t	\N
2397	ROMINA PROFESORA			2026-01-12 15:56:02.705159-03	2026-01-12 15:56:02.705159-03	1	t	\N
2398	MICAELA GONZALEZ			2026-01-12 15:56:02.707236-03	2026-01-12 15:56:02.707236-03	1	t	\N
2399	NORMA RAMIREZ			2026-01-12 15:56:02.709387-03	2026-01-12 15:56:02.709387-03	1	t	\N
2400	ALEJANDRO ACEVEY			2026-01-12 15:56:02.711296-03	2026-01-12 15:56:02.711296-03	1	t	\N
2401	NICOL			2026-01-12 15:56:02.71309-03	2026-01-12 15:56:02.71309-03	1	t	\N
2402	FLORENCIA LEMES			2026-01-12 15:56:02.715216-03	2026-01-12 15:56:02.715216-03	1	t	\N
2403	MILENA			2026-01-12 15:56:02.717313-03	2026-01-12 15:56:02.717313-03	1	t	\N
2404	QUIRA			2026-01-12 15:56:02.719473-03	2026-01-12 15:56:02.719473-03	1	t	\N
2405	NICO			2026-01-12 15:56:02.721369-03	2026-01-12 15:56:02.721369-03	1	t	\N
2406	DANIELA CARDOZO			2026-01-12 15:56:02.723692-03	2026-01-12 15:56:02.723692-03	1	t	\N
2407	JUAN MEZA			2026-01-12 15:56:02.725809-03	2026-01-12 15:56:02.725809-03	1	t	\N
2408	LEONARDO OCHOA			2026-01-12 15:56:02.727593-03	2026-01-12 15:56:02.727593-03	1	t	\N
2409	AAS			2026-01-12 15:56:02.729521-03	2026-01-12 15:56:02.729521-03	1	t	\N
2410	INDECISA			2026-01-12 15:56:02.731956-03	2026-01-12 15:56:02.731956-03	1	t	\N
2411	HANNA			2026-01-12 15:56:02.734149-03	2026-01-12 15:56:02.734149-03	1	t	\N
2412	ELIAS ALEXIS			2026-01-12 15:56:02.736262-03	2026-01-12 15:56:02.736262-03	1	t	\N
2413	AGUS D"AGOSTINO			2026-01-12 15:56:02.738295-03	2026-01-12 15:56:02.738295-03	1	t	\N
2414	BIANCA			2026-01-12 15:56:02.740414-03	2026-01-12 15:56:02.740414-03	1	t	\N
2415	ESTEFANIA MONTES			2026-01-12 15:56:02.74264-03	2026-01-12 15:56:02.74264-03	1	t	\N
2416	ROLON			2026-01-12 15:56:02.744683-03	2026-01-12 15:56:02.744683-03	1	t	\N
2417	CLAUDIO HIJO DE ROBERTO			2026-01-12 15:56:02.746657-03	2026-01-12 15:56:02.746657-03	1	t	\N
2418	MAITHENA HERMANA DE ALEJO			2026-01-12 15:56:02.748623-03	2026-01-12 15:56:02.748623-03	1	t	\N
2419	EZEQUIEL BENITEZ			2026-01-12 15:56:02.750836-03	2026-01-12 15:56:02.750836-03	1	t	\N
2420	LUDMILA MEZA			2026-01-12 15:56:02.753124-03	2026-01-12 15:56:02.753124-03	1	t	\N
2421	ALEJAN L			2026-01-12 15:56:02.755518-03	2026-01-12 15:56:02.755518-03	1	t	\N
2422	ALEJANDRA L			2026-01-12 15:56:02.772404-03	2026-01-12 15:56:02.772404-03	1	t	\N
2423	CIN			2026-01-12 15:56:02.774451-03	2026-01-12 15:56:02.774451-03	1	t	\N
2424	LUCIANO PATTONE			2026-01-12 15:56:02.776499-03	2026-01-12 15:56:02.776499-03	1	t	\N
2425	ADRIAN CORRENTINO			2026-01-12 15:56:02.778436-03	2026-01-12 15:56:02.778436-03	1	t	\N
2427	VANESA GOMEZ			2026-01-12 15:56:02.782423-03	2026-01-12 15:56:02.782423-03	1	t	\N
2428	CELENE LAURENS			2026-01-12 15:56:02.784615-03	2026-01-12 15:56:02.784615-03	1	t	\N
2429	BENJAMIN ARABES			2026-01-12 15:56:02.787126-03	2026-01-12 15:56:02.787126-03	1	t	\N
2430	LUCHO			2026-01-12 15:56:02.789534-03	2026-01-12 15:56:02.789534-03	1	t	\N
2431	F			2026-01-12 15:56:02.791752-03	2026-01-12 15:56:02.791752-03	1	t	\N
2432	LEONEL OCHOA			2026-01-12 15:56:02.793889-03	2026-01-12 15:56:02.793889-03	1	t	\N
2433	GALO KLUG			2026-01-12 15:56:02.79609-03	2026-01-12 15:56:02.79609-03	1	t	\N
2434	LUDMILA SAAVEDRA			2026-01-12 15:56:02.798247-03	2026-01-12 15:56:02.798247-03	1	t	\N
2435	RAMIN VELAZQUEZ			2026-01-12 15:56:02.800551-03	2026-01-12 15:56:02.800551-03	1	t	\N
2436	LUIS GODOY			2026-01-12 15:56:02.802808-03	2026-01-12 15:56:02.802808-03	1	t	\N
2437	SANTI ABREGU			2026-01-12 15:56:02.805047-03	2026-01-12 15:56:02.805047-03	1	t	\N
2438	HERNAN OBREGON			2026-01-12 15:56:02.807066-03	2026-01-12 15:56:02.807066-03	1	t	\N
2439	REBECA HIJA DE MARU			2026-01-12 15:56:02.809383-03	2026-01-12 15:56:02.809383-03	1	t	\N
2440	ROBERTO DELGADO			2026-01-12 15:56:02.811468-03	2026-01-12 15:56:02.811468-03	1	t	\N
2441	FERNANDO ABARES			2026-01-12 15:56:02.813667-03	2026-01-12 15:56:02.813667-03	1	t	\N
2442	FRANCO CHEF			2026-01-12 15:56:02.815875-03	2026-01-12 15:56:02.815875-03	1	t	\N
2443	JAVIER ALEJO			2026-01-12 15:56:02.818055-03	2026-01-12 15:56:02.818055-03	1	t	\N
2444	INES DE MELINA			2026-01-12 15:56:02.820395-03	2026-01-12 15:56:02.820395-03	1	t	\N
2445	NICOLAS PATONE			2026-01-12 15:56:02.822454-03	2026-01-12 15:56:02.822454-03	1	t	\N
2446	WILLIAM			2026-01-12 15:56:02.824422-03	2026-01-12 15:56:02.824422-03	1	t	\N
2447	MIRIAM AVALOS			2026-01-12 15:56:02.861396-03	2026-01-12 15:56:02.861396-03	1	t	\N
2448	LUCAS SANDOVAL			2026-01-12 15:56:02.862914-03	2026-01-12 15:56:02.862914-03	1	t	\N
2449	ABI			2026-01-12 15:56:02.86441-03	2026-01-12 15:56:02.86441-03	1	t	\N
2450	LORENA MANDILE			2026-01-12 15:56:02.865964-03	2026-01-12 15:56:02.865964-03	1	t	\N
2451	MARIA SANTANGELO			2026-01-12 15:56:02.867361-03	2026-01-12 15:56:02.867361-03	1	t	\N
2452	SOFIA MACARENA			2026-01-12 15:56:02.868796-03	2026-01-12 15:56:02.868796-03	1	t	\N
2454	MATAS PIZERO			2026-01-12 15:56:02.8715-03	2026-01-12 15:56:02.8715-03	1	t	\N
2455	JONYW			2026-01-12 15:56:02.872719-03	2026-01-12 15:56:02.872719-03	1	t	\N
2456	SOLANGE GONZALES			2026-01-12 15:56:02.874331-03	2026-01-12 15:56:02.874331-03	1	t	\N
2457	MORENA PAGANINI			2026-01-12 15:56:02.876237-03	2026-01-12 15:56:02.876237-03	1	t	\N
2458	LUCIANO EZEQUIEL			2026-01-12 15:56:02.878332-03	2026-01-12 15:56:02.878332-03	1	t	\N
2459	FRANCO TORREZ			2026-01-12 15:56:02.880345-03	2026-01-12 15:56:02.880345-03	1	t	\N
2460	GRISELDA BENITEZ			2026-01-12 15:56:02.882738-03	2026-01-12 15:56:02.882738-03	1	t	\N
2461	RAUL DELGADO			2026-01-12 15:56:02.885484-03	2026-01-12 15:56:02.885484-03	1	t	\N
2462	NORMA MONFORTE			2026-01-12 15:56:02.888792-03	2026-01-12 15:56:02.888792-03	1	t	\N
2463	CRISTIAN PEREZ			2026-01-12 15:56:02.890736-03	2026-01-12 15:56:02.890736-03	1	t	\N
2464	DANA PAZ			2026-01-12 15:56:02.892625-03	2026-01-12 15:56:02.892625-03	1	t	\N
2465	ESTEFANIA NUÑEZ			2026-01-12 15:56:02.894354-03	2026-01-12 15:56:02.894354-03	1	t	\N
2466	EVE			2026-01-12 15:56:02.895888-03	2026-01-12 15:56:02.895888-03	1	t	\N
2467	CAROLINA ZALAZAR			2026-01-12 15:56:02.897043-03	2026-01-12 15:56:02.897043-03	1	t	\N
2468	MELINA ALARCON			2026-01-12 15:56:02.898557-03	2026-01-12 15:56:02.898557-03	1	t	\N
2469	CAMILA DIAZ			2026-01-12 15:56:02.90034-03	2026-01-12 15:56:02.90034-03	1	t	\N
2470	VILLANUEVA CINTIA			2026-01-12 15:56:02.902393-03	2026-01-12 15:56:02.902393-03	1	t	\N
2471	RODRIGO SILVA			2026-01-12 15:56:02.904327-03	2026-01-12 15:56:02.904327-03	1	t	\N
2472	FACUNDO MARTINEZ			2026-01-12 15:56:02.906837-03	2026-01-12 15:56:02.906837-03	1	t	\N
2473	OLGA ALMUA			2026-01-12 15:56:02.909264-03	2026-01-12 15:56:02.909264-03	1	t	\N
2474	FLORES ALEJANDRO			2026-01-12 15:56:02.911385-03	2026-01-12 15:56:02.911385-03	1	t	\N
2475	GLADYS VAZQUEZ			2026-01-12 15:56:02.913434-03	2026-01-12 15:56:02.913434-03	1	t	\N
2476	DORA			2026-01-12 15:56:02.917575-03	2026-01-12 15:56:02.917575-03	1	t	\N
2477	OCHOA			2026-01-12 15:56:02.919595-03	2026-01-12 15:56:02.919595-03	1	t	\N
2478	F			2026-01-12 15:56:02.921386-03	2026-01-12 15:56:02.921386-03	1	t	\N
2479	ABARES			2026-01-12 15:56:02.923285-03	2026-01-12 15:56:02.923285-03	1	t	\N
2480	J			2026-01-12 15:56:02.92507-03	2026-01-12 15:56:02.92507-03	1	t	\N
2481	GIMENES MARTIN			2026-01-12 15:56:02.926904-03	2026-01-12 15:56:02.926904-03	1	t	\N
2482	LILIANA CARDOZO			2026-01-12 15:56:02.929074-03	2026-01-12 15:56:02.929074-03	1	t	\N
2483	MARIA SANTANGELO			2026-01-12 15:56:02.931089-03	2026-01-12 15:56:02.931089-03	1	t	\N
2484	NICOLAS MOLINA			2026-01-12 15:56:02.933347-03	2026-01-12 15:56:02.933347-03	1	t	\N
2485	RUBIA DE PELO LARGO			2026-01-12 15:56:02.935304-03	2026-01-12 15:56:02.935304-03	1	t	\N
2486	PATRICIO BIZCARRO			2026-01-12 15:56:02.937655-03	2026-01-12 15:56:02.937655-03	1	t	\N
2487	NORMA ACOSTA			2026-01-12 15:56:02.93965-03	2026-01-12 15:56:02.93965-03	1	t	\N
2488	LINDA			2026-01-12 15:56:02.941671-03	2026-01-12 15:56:02.941671-03	1	t	\N
2489	HECTOR GODOY			2026-01-12 15:56:02.943685-03	2026-01-12 15:56:02.943685-03	1	t	\N
2490	MARIA EUGENIA			2026-01-12 15:56:02.945839-03	2026-01-12 15:56:02.945839-03	1	t	\N
2491	OSCAR PINO			2026-01-12 15:56:02.947791-03	2026-01-12 15:56:02.947791-03	1	t	\N
2492	LUDMILA SAVEDR			2026-01-12 15:56:02.949828-03	2026-01-12 15:56:02.949828-03	1	t	\N
2493	HECTOR			2026-01-12 15:56:02.952008-03	2026-01-12 15:56:02.952008-03	1	t	\N
2494	TIERRA DE MASCOTAS			2026-01-12 15:56:02.954231-03	2026-01-12 15:56:02.954231-03	1	t	\N
2495	CELIA			2026-01-12 15:56:02.956381-03	2026-01-12 15:56:02.956381-03	1	t	\N
2496	ALEJANDRA PELO COLORADO			2026-01-12 15:56:02.958671-03	2026-01-12 15:56:02.958671-03	1	t	\N
2497	V			2026-01-12 15:56:02.960797-03	2026-01-12 15:56:02.960797-03	1	t	\N
2498	GRA SABRINA			2026-01-12 15:56:02.962746-03	2026-01-12 15:56:02.962746-03	1	t	\N
2499	MILI			2026-01-12 15:56:02.964724-03	2026-01-12 15:56:02.964724-03	1	t	\N
2500	ANA DIAZ			2026-01-12 15:56:02.966688-03	2026-01-12 15:56:02.966688-03	1	t	\N
2501	MARCELO BROCHERO			2026-01-12 15:56:02.968585-03	2026-01-12 15:56:02.968585-03	1	t	\N
2502	ABRIL BENITEZ			2026-01-12 15:56:02.970539-03	2026-01-12 15:56:02.970539-03	1	t	\N
2503	HERNAN			2026-01-12 15:56:02.972554-03	2026-01-12 15:56:02.972554-03	1	t	\N
2504	ANGELINA CHOCO			2026-01-12 15:56:02.974406-03	2026-01-12 15:56:02.974406-03	1	t	\N
2505	ALEXIS MEZA			2026-01-12 15:56:02.976364-03	2026-01-12 15:56:02.976364-03	1	t	\N
2506	FLOR LOPEZ			2026-01-12 15:56:02.978298-03	2026-01-12 15:56:02.978298-03	1	t	\N
2507	ADRIAN BROCHERO			2026-01-12 15:56:02.980126-03	2026-01-12 15:56:02.980126-03	1	t	\N
2508	AILEN PAZ			2026-01-12 15:56:02.981994-03	2026-01-12 15:56:02.981994-03	1	t	\N
2509	SANDARA ROMERO			2026-01-12 15:56:02.98418-03	2026-01-12 15:56:02.98418-03	1	t	\N
2510	MICAELA ZULMA			2026-01-12 15:56:02.986033-03	2026-01-12 15:56:02.986033-03	1	t	\N
2511	BRENDA			2026-01-12 15:56:02.987968-03	2026-01-12 15:56:02.987968-03	1	t	\N
2512	YANINA LUGONES			2026-01-12 15:56:02.989938-03	2026-01-12 15:56:02.989938-03	1	t	\N
2513	BIANCA			2026-01-12 15:56:02.992173-03	2026-01-12 15:56:02.992173-03	1	t	\N
2514	MALVINA			2026-01-12 15:56:02.994044-03	2026-01-12 15:56:02.994044-03	1	t	\N
2515	GONZALO NEGRETE			2026-01-12 15:56:02.99601-03	2026-01-12 15:56:02.99601-03	1	t	\N
2516	MATIAS ROLDAN			2026-01-12 15:56:02.997975-03	2026-01-12 15:56:02.997975-03	1	t	\N
2517	DIEGO CIRES			2026-01-12 15:56:02.9998-03	2026-01-12 15:56:02.9998-03	1	t	\N
2518	PAPA DEL SODERO			2026-01-12 15:56:03.001655-03	2026-01-12 15:56:03.001655-03	1	t	\N
2519	MARCELA			2026-01-12 15:56:03.003482-03	2026-01-12 15:56:03.003482-03	1	t	\N
2520	MAURICIO MENDOZA			2026-01-12 15:56:03.005493-03	2026-01-12 15:56:03.005493-03	1	t	\N
2521	BIANCA			2026-01-12 15:56:03.00804-03	2026-01-12 15:56:03.00804-03	1	t	\N
2522	MUGUEL			2026-01-12 15:56:03.010443-03	2026-01-12 15:56:03.010443-03	1	t	\N
2523	PELUQUERO			2026-01-12 15:56:03.01263-03	2026-01-12 15:56:03.01263-03	1	t	\N
2524	MELISA			2026-01-12 15:56:03.014889-03	2026-01-12 15:56:03.014889-03	1	t	\N
2525	MAXI ABREGU			2026-01-12 15:56:03.017077-03	2026-01-12 15:56:03.017077-03	1	t	\N
2526	BRENDA SILVA			2026-01-12 15:56:03.019204-03	2026-01-12 15:56:03.019204-03	1	t	\N
2527	YOANA MAMA DE CIRO			2026-01-12 15:56:03.021306-03	2026-01-12 15:56:03.021306-03	1	t	\N
2528	GASTON GIMENEZ			2026-01-12 15:56:03.023299-03	2026-01-12 15:56:03.023299-03	1	t	\N
2529	MENDE			2026-01-12 15:56:03.025371-03	2026-01-12 15:56:03.025371-03	1	t	\N
2530	EVE AMIGA ABY			2026-01-12 15:56:03.027296-03	2026-01-12 15:56:03.027296-03	1	t	\N
2531	GISELA			2026-01-12 15:56:03.029275-03	2026-01-12 15:56:03.029275-03	1	t	\N
2532	JULIETA			2026-01-12 15:56:03.031267-03	2026-01-12 15:56:03.031267-03	1	t	\N
2533	MILAGROS GUZMAN			2026-01-12 15:56:03.033292-03	2026-01-12 15:56:03.033292-03	1	t	\N
2534	MIRTA			2026-01-12 15:56:03.035311-03	2026-01-12 15:56:03.035311-03	1	t	\N
2535	FERNANDO			2026-01-12 15:56:03.037365-03	2026-01-12 15:56:03.037365-03	1	t	\N
2536	MAIRA DIAZ			2026-01-12 15:56:03.03977-03	2026-01-12 15:56:03.03977-03	1	t	\N
2537	GABRIEL BARRAZA			2026-01-12 15:56:03.04191-03	2026-01-12 15:56:03.04191-03	1	t	\N
2538	TORETO			2026-01-12 15:56:03.044167-03	2026-01-12 15:56:03.044167-03	1	t	\N
2539	DANIELA MORENO FREDI			2026-01-12 15:56:03.046205-03	2026-01-12 15:56:03.046205-03	1	t	\N
2540	ELIZABET GIMENEZ			2026-01-12 15:56:03.048156-03	2026-01-12 15:56:03.048156-03	1	t	\N
2541	DEVORA			2026-01-12 15:56:03.050139-03	2026-01-12 15:56:03.050139-03	1	t	\N
2542	RAMONA HERMANA DE MARU			2026-01-12 15:56:03.05209-03	2026-01-12 15:56:03.05209-03	1	t	\N
2543	HECTOR RUS			2026-01-12 15:56:03.054166-03	2026-01-12 15:56:03.054166-03	1	t	\N
2544	ROSA QUIROS			2026-01-12 15:56:03.056222-03	2026-01-12 15:56:03.056222-03	1	t	\N
2545	YOANA CIRO			2026-01-12 15:56:03.058388-03	2026-01-12 15:56:03.058388-03	1	t	\N
2546	MARTIN NINO			2026-01-12 15:56:03.060345-03	2026-01-12 15:56:03.060345-03	1	t	\N
2547	SILVIA			2026-01-12 15:56:03.062192-03	2026-01-12 15:56:03.062192-03	1	t	\N
2548	MABEL AMIGA DE DORA			2026-01-12 15:56:03.064242-03	2026-01-12 15:56:03.064242-03	1	t	\N
2549	EMILIANO ISOLINA			2026-01-12 15:56:03.066328-03	2026-01-12 15:56:03.066328-03	1	t	\N
2550	FRANCISCO LUCAS			2026-01-12 15:56:03.068714-03	2026-01-12 15:56:03.068714-03	1	t	\N
2551	CHECO			2026-01-12 15:56:03.070876-03	2026-01-12 15:56:03.070876-03	1	t	\N
2552	LILIAN			2026-01-12 15:56:03.072821-03	2026-01-12 15:56:03.072821-03	1	t	\N
2553	DORS			2026-01-12 15:56:03.074719-03	2026-01-12 15:56:03.074719-03	1	t	\N
2554	MIGUEL DELIA			2026-01-12 15:56:03.076668-03	2026-01-12 15:56:03.076668-03	1	t	\N
2555	PETIISA			2026-01-12 15:56:03.078709-03	2026-01-12 15:56:03.078709-03	1	t	\N
2556	MATIAS NOVIO DE ANGI			2026-01-12 15:56:03.080875-03	2026-01-12 15:56:03.080875-03	1	t	\N
2557	LORENA LAURENS			2026-01-12 15:56:03.082972-03	2026-01-12 15:56:03.082972-03	1	t	\N
2558	LILIANA MONTOYA			2026-01-12 15:56:03.085379-03	2026-01-12 15:56:03.085379-03	1	t	\N
2559	ELI HERMANA DE ABI			2026-01-12 15:56:03.08753-03	2026-01-12 15:56:03.08753-03	1	t	\N
2560	BIANCA			2026-01-12 15:56:03.089556-03	2026-01-12 15:56:03.089556-03	1	t	\N
2561	ANDREA GONZALEZ			2026-01-12 15:56:03.091583-03	2026-01-12 15:56:03.091583-03	1	t	\N
2562	CAMILA MOYANO			2026-01-12 15:56:03.093425-03	2026-01-12 15:56:03.093425-03	1	t	\N
2563	RUBEN BENAVIDEZ			2026-01-12 15:56:03.095318-03	2026-01-12 15:56:03.095318-03	1	t	\N
2564	CAMILA CHECO			2026-01-12 15:56:03.097342-03	2026-01-12 15:56:03.097342-03	1	t	\N
2565	ASSS			2026-01-12 15:56:03.099397-03	2026-01-12 15:56:03.099397-03	1	t	\N
2566	ANA  MARIA DIAZ			2026-01-12 15:56:03.101504-03	2026-01-12 15:56:03.101504-03	1	t	\N
2567	EZEQUIEL ESTEFANIA			2026-01-12 15:56:03.103622-03	2026-01-12 15:56:03.103622-03	1	t	\N
2568	DAY			2026-01-12 15:56:03.106112-03	2026-01-12 15:56:03.106112-03	1	t	\N
2569	ANA ELISA			2026-01-12 15:56:03.108521-03	2026-01-12 15:56:03.108521-03	1	t	\N
2570	ALICIA MIGUEL			2026-01-12 15:56:03.110731-03	2026-01-12 15:56:03.110731-03	1	t	\N
2571	YANINA ROLON			2026-01-12 15:56:03.112695-03	2026-01-12 15:56:03.112695-03	1	t	\N
2572	BIANCA			2026-01-12 15:56:03.114549-03	2026-01-12 15:56:03.114549-03	1	t	\N
2573	GRISELDA JUAN			2026-01-12 15:56:03.116442-03	2026-01-12 15:56:03.116442-03	1	t	\N
2574	CHURROS MUJER			2026-01-12 15:56:03.118367-03	2026-01-12 15:56:03.118367-03	1	t	\N
2575	FABIAN TIO BIANCA			2026-01-12 15:56:03.120457-03	2026-01-12 15:56:03.120457-03	1	t	\N
2576	LUCAS  CELIA			2026-01-12 15:56:03.122526-03	2026-01-12 15:56:03.122526-03	1	t	\N
2577	RODRIGO PILAR			2026-01-12 15:56:03.124526-03	2026-01-12 15:56:03.124526-03	1	t	\N
2578	TOMAS BASSINO			2026-01-12 15:56:03.1264-03	2026-01-12 15:56:03.1264-03	1	t	\N
2579	A			2026-01-12 15:56:03.128157-03	2026-01-12 15:56:03.128157-03	1	t	\N
2580	JONATAN PUCHETA			2026-01-12 15:56:03.129589-03	2026-01-12 15:56:03.129589-03	1	t	\N
2581	F			2026-01-12 15:56:03.130939-03	2026-01-12 15:56:03.130939-03	1	t	\N
2582	NICO HIJO DE PAULA			2026-01-12 15:56:03.132629-03	2026-01-12 15:56:03.132629-03	1	t	\N
2583	VANINA			2026-01-12 15:56:03.134663-03	2026-01-12 15:56:03.134663-03	1	t	\N
2584	CHECO BENU			2026-01-12 15:56:03.136605-03	2026-01-12 15:56:03.136605-03	1	t	\N
2585	LITO MUJER			2026-01-12 15:56:03.1386-03	2026-01-12 15:56:03.1386-03	1	t	\N
2586	MELISA ALEJO			2026-01-12 15:56:03.140576-03	2026-01-12 15:56:03.140576-03	1	t	\N
2587	DANI			2026-01-12 15:56:03.14267-03	2026-01-12 15:56:03.14267-03	1	t	\N
2588	ANGEL COLECTIVERO			2026-01-12 15:56:03.14463-03	2026-01-12 15:56:03.14463-03	1	t	\N
2589	RODRIGO HIJO BOCHI			2026-01-12 15:56:03.146724-03	2026-01-12 15:56:03.146724-03	1	t	\N
2590	TRENZAS ANDREA			2026-01-12 15:56:03.148698-03	2026-01-12 15:56:03.148698-03	1	t	\N
2591	RO LON			2026-01-12 15:56:03.150543-03	2026-01-12 15:56:03.150543-03	1	t	\N
2592	N			2026-01-12 15:56:03.152379-03	2026-01-12 15:56:03.152379-03	1	t	\N
2593	DANI			2026-01-12 15:56:03.154327-03	2026-01-12 15:56:03.154327-03	1	t	\N
2594	PAPA DE CAMILO			2026-01-12 15:56:03.156692-03	2026-01-12 15:56:03.156692-03	1	t	\N
2595	VICTOR			2026-01-12 15:56:03.159341-03	2026-01-12 15:56:03.159341-03	1	t	\N
2596	ALMACEN			2026-01-12 15:56:03.161659-03	2026-01-12 15:56:03.161659-03	1	t	\N
2597	SERGIO JUAREZ			2026-01-12 15:56:03.163962-03	2026-01-12 15:56:03.163962-03	1	t	\N
2598	JONATAN CELESTE			2026-01-12 15:56:03.165958-03	2026-01-12 15:56:03.165958-03	1	t	\N
2599	FABIAN AMIGO DE MARCELA			2026-01-12 15:56:03.167846-03	2026-01-12 15:56:03.167846-03	1	t	\N
2600	MAMA DE VIOLIN			2026-01-12 15:56:03.169772-03	2026-01-12 15:56:03.169772-03	1	t	\N
2601	ROLON			2026-01-12 15:56:03.171723-03	2026-01-12 15:56:03.171723-03	1	t	\N
2602	LEO			2026-01-12 15:56:03.173748-03	2026-01-12 15:56:03.173748-03	1	t	\N
2603	DON ROBERTO			2026-01-12 15:56:03.175761-03	2026-01-12 15:56:03.175761-03	1	t	\N
2604	MARCELO ROLON			2026-01-12 15:56:03.177689-03	2026-01-12 15:56:03.177689-03	1	t	\N
2605	SOLE			2026-01-12 15:56:03.179631-03	2026-01-12 15:56:03.179631-03	1	t	\N
2606	SECILIO			2026-01-12 15:56:03.181502-03	2026-01-12 15:56:03.181502-03	1	t	\N
2607	FERNANDA  GONZALEZ			2026-01-12 15:56:03.183502-03	2026-01-12 15:56:03.183502-03	1	t	\N
2608	NANCY			2026-01-12 15:56:03.18538-03	2026-01-12 15:56:03.18538-03	1	t	\N
2609	Z			2026-01-12 15:56:03.18954-03	2026-01-12 15:56:03.18954-03	1	t	\N
2610	BIANCA			2026-01-12 15:56:03.191553-03	2026-01-12 15:56:03.191553-03	1	t	\N
2611	BIIANCA			2026-01-12 15:56:03.193456-03	2026-01-12 15:56:03.193456-03	1	t	\N
2612	ROBERTO VIEJO			2026-01-12 15:56:03.195403-03	2026-01-12 15:56:03.195403-03	1	t	\N
2613	DORA			2026-01-12 15:56:03.197308-03	2026-01-12 15:56:03.197308-03	1	t	\N
2614	JORGE VIEJITO VECINO			2026-01-12 15:56:03.199227-03	2026-01-12 15:56:03.199227-03	1	t	\N
2615	ENEMIGO			2026-01-12 15:56:03.2011-03	2026-01-12 15:56:03.2011-03	1	t	\N
2616	DORA			2026-01-12 15:56:03.202938-03	2026-01-12 15:56:03.202938-03	1	t	\N
2617	Q			2026-01-12 15:56:03.204759-03	2026-01-12 15:56:03.204759-03	1	t	\N
2618	ROLON			2026-01-12 15:56:03.206944-03	2026-01-12 15:56:03.206944-03	1	t	\N
2619	EVE			2026-01-12 15:56:03.2091-03	2026-01-12 15:56:03.2091-03	1	t	\N
2620	JONI HIJO			2026-01-12 15:56:03.247254-03	2026-01-12 15:56:03.247254-03	1	t	\N
2621	ROBER			2026-01-12 15:56:03.249257-03	2026-01-12 15:56:03.249257-03	1	t	\N
2622	GRACIELA CUÑADA			2026-01-12 15:56:03.251018-03	2026-01-12 15:56:03.251018-03	1	t	\N
2623	CORENTINA			2026-01-12 15:56:03.252607-03	2026-01-12 15:56:03.252607-03	1	t	\N
2624	BENU  CAMILA			2026-01-12 15:56:03.254341-03	2026-01-12 15:56:03.254341-03	1	t	\N
2625	RICARDO MI AMIGO			2026-01-12 15:56:03.25642-03	2026-01-12 15:56:03.25642-03	1	t	\N
2626	ROBERTO			2026-01-12 15:56:03.258364-03	2026-01-12 15:56:03.258364-03	1	t	\N
2627	BIANCA			2026-01-12 15:56:03.260419-03	2026-01-12 15:56:03.260419-03	1	t	\N
2628	MARCELO ACEVEDO			2026-01-12 15:56:03.262404-03	2026-01-12 15:56:03.262404-03	1	t	\N
2629	EVE			2026-01-12 15:56:03.264334-03	2026-01-12 15:56:03.264334-03	1	t	\N
2630	D'AGOSTI A			2026-01-12 15:56:03.266195-03	2026-01-12 15:56:03.266195-03	1	t	\N
2631	SUSANA DE NELI			2026-01-12 15:56:03.267946-03	2026-01-12 15:56:03.267946-03	1	t	\N
2632	MARIO CARNICERIA			2026-01-12 15:56:03.269832-03	2026-01-12 15:56:03.269832-03	1	t	\N
2633	CARBONERIA			2026-01-12 15:56:03.271574-03	2026-01-12 15:56:03.271574-03	1	t	\N
2634	SUEGA DE SABRINA			2026-01-12 15:56:03.273367-03	2026-01-12 15:56:03.273367-03	1	t	\N
2635	CELI			2026-01-12 15:56:03.275332-03	2026-01-12 15:56:03.275332-03	1	t	\N
2636	NICOLAS BIMBO			2026-01-12 15:56:03.277295-03	2026-01-12 15:56:03.277295-03	1	t	\N
2637	SILVIA			2026-01-12 15:56:03.279147-03	2026-01-12 15:56:03.279147-03	1	t	\N
2638	A			2026-01-12 15:56:03.280888-03	2026-01-12 15:56:03.280888-03	1	t	\N
2639	DANIEL			2026-01-12 15:56:03.28269-03	2026-01-12 15:56:03.28269-03	1	t	\N
2640	RUVIA			2026-01-12 15:56:03.284646-03	2026-01-12 15:56:03.284646-03	1	t	\N
2641	ALEJANDRO			2026-01-12 15:56:03.286577-03	2026-01-12 15:56:03.286577-03	1	t	\N
2642	KIARA			2026-01-12 15:56:03.28837-03	2026-01-12 15:56:03.28837-03	1	t	\N
2643	ALDO			2026-01-12 15:56:03.289888-03	2026-01-12 15:56:03.289888-03	1	t	\N
2644	ABI HIJA			2026-01-12 15:56:03.291446-03	2026-01-12 15:56:03.291446-03	1	t	\N
2645	SULMA TAPER			2026-01-12 15:56:03.293381-03	2026-01-12 15:56:03.293381-03	1	t	\N
2646	LUCAS PELO BLANCO			2026-01-12 15:56:03.295323-03	2026-01-12 15:56:03.295323-03	1	t	\N
2647	RAUL PIZERO			2026-01-12 15:56:03.297113-03	2026-01-12 15:56:03.297113-03	1	t	\N
2649	FERNANDO HARINA			2026-01-12 15:56:03.300789-03	2026-01-12 15:56:03.300789-03	1	t	\N
2650	LUDMILA VIOLIN			2026-01-12 15:56:03.302565-03	2026-01-12 15:56:03.302565-03	1	t	\N
2651	Y			2026-01-12 15:56:03.304329-03	2026-01-12 15:56:03.304329-03	1	t	\N
2652	SEBA			2026-01-12 15:56:03.306272-03	2026-01-12 15:56:03.306272-03	1	t	\N
2653	DARIO ESQUINA			2026-01-12 15:56:03.308362-03	2026-01-12 15:56:03.308362-03	1	t	\N
2654	HERMANO DE SILVIA			2026-01-12 15:56:03.310184-03	2026-01-12 15:56:03.310184-03	1	t	\N
2655	MARCELO HILDA			2026-01-12 15:56:03.311726-03	2026-01-12 15:56:03.311726-03	1	t	\N
2656	PALI			2026-01-12 15:56:03.313337-03	2026-01-12 15:56:03.313337-03	1	t	\N
2657	MARCELO LENCINA			2026-01-12 15:56:03.314968-03	2026-01-12 15:56:03.314968-03	1	t	\N
2658	CELIA			2026-01-12 15:56:03.316566-03	2026-01-12 15:56:03.316566-03	1	t	\N
2659	SOFIA			2026-01-12 15:56:03.31831-03	2026-01-12 15:56:03.31831-03	1	t	\N
2660	C			2026-01-12 15:56:03.320064-03	2026-01-12 15:56:03.320064-03	1	t	\N
2661	NANCY			2026-01-12 15:56:03.321651-03	2026-01-12 15:56:03.321651-03	1	t	\N
2662	Q			2026-01-12 15:56:03.323215-03	2026-01-12 15:56:03.323215-03	1	t	\N
2663	ESPEJOS			2026-01-12 15:56:03.324791-03	2026-01-12 15:56:03.324791-03	1	t	\N
2664	JESI VELAZQUEZ			2026-01-12 15:56:03.32672-03	2026-01-12 15:56:03.32672-03	1	t	\N
2665	JORGE SOSA  PINII			2026-01-12 15:56:03.328722-03	2026-01-12 15:56:03.328722-03	1	t	\N
2666	ARIE GABRIELA			2026-01-12 15:56:03.330765-03	2026-01-12 15:56:03.330765-03	1	t	\N
2667	MELINA RONCERO			2026-01-12 15:56:03.333458-03	2026-01-12 15:56:03.333458-03	1	t	\N
2668	ELIANA OJEDA			2026-01-12 15:56:03.335958-03	2026-01-12 15:56:03.335958-03	1	t	\N
2669	EVE			2026-01-12 15:56:03.338071-03	2026-01-12 15:56:03.338071-03	1	t	\N
2670	RAQUEL HERMANA DE JONI			2026-01-12 15:56:03.340027-03	2026-01-12 15:56:03.340027-03	1	t	\N
2671	GABI FAMILIAR DE LORE			2026-01-12 15:56:03.341794-03	2026-01-12 15:56:03.341794-03	1	t	\N
2672	EVE			2026-01-12 15:56:03.343664-03	2026-01-12 15:56:03.343664-03	1	t	\N
2673	HORACI LOPEZ			2026-01-12 15:56:03.345528-03	2026-01-12 15:56:03.345528-03	1	t	\N
2674	JUAN CHOFER DE PABLO			2026-01-12 15:56:03.347443-03	2026-01-12 15:56:03.347443-03	1	t	\N
2675	CECILIO			2026-01-12 15:56:03.349568-03	2026-01-12 15:56:03.349568-03	1	t	\N
2676	MARI SEÑORA MAYOR			2026-01-12 15:56:03.353716-03	2026-01-12 15:56:03.353716-03	1	t	\N
2677	A			2026-01-12 15:56:03.355604-03	2026-01-12 15:56:03.355604-03	1	t	\N
2678	ANA			2026-01-12 15:56:03.357549-03	2026-01-12 15:56:03.357549-03	1	t	\N
2679	PAULA			2026-01-12 15:56:03.359625-03	2026-01-12 15:56:03.359625-03	1	t	\N
2680	LEO BANEGAS			2026-01-12 15:56:03.361449-03	2026-01-12 15:56:03.361449-03	1	t	\N
2681	A			2026-01-12 15:56:03.363063-03	2026-01-12 15:56:03.363063-03	1	t	\N
2682	T			2026-01-12 15:56:03.364577-03	2026-01-12 15:56:03.364577-03	1	t	\N
2683	RUBIA PETISA			2026-01-12 15:56:03.366346-03	2026-01-12 15:56:03.366346-03	1	t	\N
2684	MATIAS BROCHERO			2026-01-12 15:56:03.368219-03	2026-01-12 15:56:03.368219-03	1	t	\N
2685	MICAELA MORALES			2026-01-12 15:56:03.370421-03	2026-01-12 15:56:03.370421-03	1	t	\N
2686	C			2026-01-12 15:56:03.374201-03	2026-01-12 15:56:03.374201-03	1	t	\N
2687	ALDANA FAMILIARM DE LORENA LENCINA			2026-01-12 15:56:03.376479-03	2026-01-12 15:56:03.376479-03	1	t	\N
2688	JUAN CARLOS AQUNO			2026-01-12 15:56:03.378445-03	2026-01-12 15:56:03.378445-03	1	t	\N
2689	A			2026-01-12 15:56:03.380514-03	2026-01-12 15:56:03.380514-03	1	t	\N
2690	U			2026-01-12 15:56:03.382726-03	2026-01-12 15:56:03.382726-03	1	t	\N
2691	R			2026-01-12 15:56:03.384827-03	2026-01-12 15:56:03.384827-03	1	t	\N
2692	HERMANO DE JOSE POLICIA			2026-01-12 15:56:03.386766-03	2026-01-12 15:56:03.386766-03	1	t	\N
2693	ESPOSA DEL CARPINTER			2026-01-12 15:56:03.388532-03	2026-01-12 15:56:03.388532-03	1	t	\N
2694	ALE SAL			2026-01-12 15:56:03.3905-03	2026-01-12 15:56:03.3905-03	1	t	\N
2695	ABI CUMPLEAÑO JERE			2026-01-12 15:56:03.392573-03	2026-01-12 15:56:03.392573-03	1	t	\N
2696	LAURA BONINI			2026-01-12 15:56:03.394925-03	2026-01-12 15:56:03.394925-03	1	t	\N
2697	ROLON			2026-01-12 15:56:03.397177-03	2026-01-12 15:56:03.397177-03	1	t	\N
2698	SEBA PAULA			2026-01-12 15:56:03.399009-03	2026-01-12 15:56:03.399009-03	1	t	\N
2699	RAQUEL			2026-01-12 15:56:03.400322-03	2026-01-12 15:56:03.400322-03	1	t	\N
2700	PEPA HERMANA DE BENJA			2026-01-12 15:56:03.401468-03	2026-01-12 15:56:03.401468-03	1	t	\N
2701	N			2026-01-12 15:56:03.402818-03	2026-01-12 15:56:03.402818-03	1	t	\N
2702	CHINCHUN			2026-01-12 15:56:03.404053-03	2026-01-12 15:56:03.404053-03	1	t	\N
2703	MARU			2026-01-12 15:56:03.404967-03	2026-01-12 15:56:03.404967-03	1	t	\N
2704	PABLO PANADERO			2026-01-12 15:56:03.405918-03	2026-01-12 15:56:03.405918-03	1	t	\N
2705	FOR K			2026-01-12 15:56:03.407051-03	2026-01-12 15:56:03.407051-03	1	t	\N
2706	MARTINA PAOLA VILLAGRA			2026-01-12 15:56:03.409397-03	2026-01-12 15:56:03.409397-03	1	t	\N
2707	BIANC			2026-01-12 15:56:03.411174-03	2026-01-12 15:56:03.411174-03	1	t	\N
2708	JOSE CHECO			2026-01-12 15:56:03.41258-03	2026-01-12 15:56:03.41258-03	1	t	\N
2709	S			2026-01-12 15:56:03.413681-03	2026-01-12 15:56:03.413681-03	1	t	\N
2710	J			2026-01-12 15:56:03.414651-03	2026-01-12 15:56:03.414651-03	1	t	\N
2711	A			2026-01-12 15:56:03.415525-03	2026-01-12 15:56:03.415525-03	1	t	\N
2712	URIEL NOVIO DE BIANCA			2026-01-12 15:56:03.416451-03	2026-01-12 15:56:03.416451-03	1	t	\N
2713	EVE AMIGA ABY			2026-01-12 15:56:03.41739-03	2026-01-12 15:56:03.41739-03	1	t	\N
2714	ALEJO			2026-01-12 15:56:03.418315-03	2026-01-12 15:56:03.418315-03	1	t	\N
2715	MARU			2026-01-12 15:56:03.41922-03	2026-01-12 15:56:03.41922-03	1	t	\N
2716	H			2026-01-12 15:56:03.420092-03	2026-01-12 15:56:03.420092-03	1	t	\N
2717	CAMILO			2026-01-12 15:56:03.420987-03	2026-01-12 15:56:03.420987-03	1	t	\N
2718	MUJER DE RUBEN LOPEZ			2026-01-12 15:56:03.421909-03	2026-01-12 15:56:03.421909-03	1	t	\N
2719	HIJO			2026-01-12 15:56:03.422806-03	2026-01-12 15:56:03.422806-03	1	t	\N
2720	A			2026-01-12 15:56:03.423688-03	2026-01-12 15:56:03.423688-03	1	t	\N
2721	MATIAS LUGO MARU			2026-01-12 15:56:03.424588-03	2026-01-12 15:56:03.424588-03	1	t	\N
2723	DIEGO  PERZ			2026-01-12 15:56:03.42644-03	2026-01-12 15:56:03.42644-03	1	t	\N
2724	HERMANO DE MARIO RUBIO			2026-01-12 15:56:03.427745-03	2026-01-12 15:56:03.427745-03	1	t	\N
2725	MARU			2026-01-12 15:56:03.429473-03	2026-01-12 15:56:03.429473-03	1	t	\N
2726	HI			2026-01-12 15:56:03.430953-03	2026-01-12 15:56:03.430953-03	1	t	\N
2727	Q			2026-01-12 15:56:03.432289-03	2026-01-12 15:56:03.432289-03	1	t	\N
2728	MARTA ADRIAN			2026-01-12 15:56:03.434336-03	2026-01-12 15:56:03.434336-03	1	t	\N
2729	DANI			2026-01-12 15:56:03.436318-03	2026-01-12 15:56:03.436318-03	1	t	\N
2730	G			2026-01-12 15:56:03.437944-03	2026-01-12 15:56:03.437944-03	1	t	\N
2731	RUBIO			2026-01-12 15:56:03.439376-03	2026-01-12 15:56:03.439376-03	1	t	\N
2732	HORACIO			2026-01-12 15:56:03.441097-03	2026-01-12 15:56:03.441097-03	1	t	\N
2734	Q			2026-01-12 15:56:03.452866-03	2026-01-12 15:56:03.452866-03	1	t	\N
2735	ALBAÑIL			2026-01-12 15:56:03.455069-03	2026-01-12 15:56:03.455069-03	1	t	\N
2736	ROLON			2026-01-12 15:56:03.46137-03	2026-01-12 15:56:03.46137-03	1	t	\N
2737	GABRIELA SOLNIK			2026-01-12 15:56:03.463258-03	2026-01-12 15:56:03.463258-03	1	t	\N
2738	PALI			2026-01-12 15:56:03.465275-03	2026-01-12 15:56:03.465275-03	1	t	\N
2739	BIANCA HIJA DE MARU			2026-01-12 15:56:03.467253-03	2026-01-12 15:56:03.467253-03	1	t	\N
2740	MIRTA			2026-01-12 15:56:03.469198-03	2026-01-12 15:56:03.469198-03	1	t	\N
2741	HIJO DE VANESA			2026-01-12 15:56:03.471186-03	2026-01-12 15:56:03.471186-03	1	t	\N
2742	SERGIO FOTOGRAFO			2026-01-12 15:56:03.47314-03	2026-01-12 15:56:03.47314-03	1	t	\N
2743	BRAIAN HERMANO DE CELESTE			2026-01-12 15:56:03.476565-03	2026-01-12 15:56:03.476565-03	1	t	\N
2744	BRAIAN TOMAS TORRES			2026-01-12 15:56:03.478548-03	2026-01-12 15:56:03.478548-03	1	t	\N
2745	F			2026-01-12 15:56:03.480222-03	2026-01-12 15:56:03.480222-03	1	t	\N
2746	A			2026-01-12 15:56:03.515479-03	2026-01-12 15:56:03.515479-03	1	t	\N
2747	BIANCA DE MARU			2026-01-12 15:56:03.517077-03	2026-01-12 15:56:03.517077-03	1	t	\N
2748	R			2026-01-12 15:56:03.518374-03	2026-01-12 15:56:03.518374-03	1	t	\N
2749	DAY			2026-01-12 15:56:03.519553-03	2026-01-12 15:56:03.519553-03	1	t	\N
2750	EVE			2026-01-12 15:56:03.52121-03	2026-01-12 15:56:03.52121-03	1	t	\N
2751	CLAUDIO			2026-01-12 15:56:03.522405-03	2026-01-12 15:56:03.522405-03	1	t	\N
2752	BRUNO			2026-01-12 15:56:03.523327-03	2026-01-12 15:56:03.523327-03	1	t	\N
2753	ROSA VECINA			2026-01-12 15:56:03.524251-03	2026-01-12 15:56:03.524251-03	1	t	\N
2754	ARIEL MIGEL			2026-01-12 15:56:03.525264-03	2026-01-12 15:56:03.525264-03	1	t	\N
2755	Cons. Final			2026-01-14 00:34:15.316667-03	2026-01-14 00:34:15.316667-03	1	t	\N
2757	anonimo			2026-01-14 00:36:21.169312-03	2026-01-14 00:36:21.169312-03	1	t	\N
2758	juancho		1130863418	2026-01-15 02:58:30.018678-03	2026-01-15 02:58:30.018678-03	1	t	
2763	PAPA DE SER			2026-01-17 11:39:31.415402-03	2026-01-17 11:39:31.415402-03	1	t	Dirección: . Info:
2092	MIGEL PAPA DE LEO	miguelangelbanegas@gmail.com	1130863418	2026-01-12 15:56:02.00291-03	2026-01-12 15:56:02.00291-03	1	t	
2759				2026-01-17 11:39:30.030123-03	2026-01-17 11:39:30.030123-03	1	t	Dirección: . Info:
2760	DANI MELINA			2026-01-17 11:39:30.150379-03	2026-01-17 11:39:30.150379-03	1	t	Dirección: . Info:
2761	UÑUV			2026-01-17 11:39:31.401741-03	2026-01-17 11:39:31.401741-03	1	t	Dirección: . Info:
2762	NAN			2026-01-17 11:39:31.408498-03	2026-01-17 11:39:31.408498-03	1	t	Dirección: . Info:
2764	LORENA ALARCON PRICILA			2026-01-17 11:39:31.422213-03	2026-01-17 11:39:31.422213-03	1	t	Dirección: . Info:
2765	MAMA DE PAOLA VILLAGRA			2026-01-17 11:39:31.426384-03	2026-01-17 11:39:31.426384-03	1	t	Dirección: . Info:
2766	SARA			2026-01-17 11:39:31.4304-03	2026-01-17 11:39:31.4304-03	1	t	Dirección: . Info:
2767	MAYTHENA BARBERIA			2026-01-17 11:39:31.43974-03	2026-01-17 11:39:31.43974-03	1	t	Dirección: . Info:
2768	ERIKA CASTAÑO			2026-01-17 11:39:31.443707-03	2026-01-17 11:39:31.443707-03	1	t	Dirección: . Info:
2769	LORE FORD KA			2026-01-17 11:39:31.448025-03	2026-01-17 11:39:31.448025-03	1	t	Dirección: . Info:
2770	TUCHI			2026-01-17 11:39:31.452415-03	2026-01-17 11:39:31.452415-03	1	t	Dirección: . Info:
2771	CAMILO MAMA			2026-01-17 11:39:31.458898-03	2026-01-17 11:39:31.458898-03	1	t	Dirección: . Info:
2772	PABLIN			2026-01-17 11:39:31.465815-03	2026-01-17 11:39:31.465815-03	1	t	Dirección: . Info:
\.


--
-- TOC entry 5146 (class 0 OID 25835)
-- Dependencies: 230
-- Data for Name: knex_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations (id, name, batch, migration_time) FROM stdin;
1	20251228132605_create_initial_schema.js	1	2025-12-28 10:39:53.491-03
2	20251228140000_update_user_roles.js	2	2025-12-28 12:11:02.92-03
3	20251229114500_fix_user_role_constraint.js	3	2025-12-29 13:11:47.454-03
4	20251229165300_create_customers_table.js	4	2025-12-29 13:53:44.524-03
5	20251229165306_add_customer_id_to_sales.js	4	2025-12-29 13:53:44.552-03
6	20251229175324_add_payment_method_to_sales.js	5	2025-12-29 14:55:31.109-03
7	20251229181035_add_status_and_notifications.js	6	2025-12-29 15:11:17.199-03
8	20251230170006_add_weight_support.js	7	2025-12-30 14:00:45.584-03
9	20260103025130_add_offers_and_audit_sale_items.js	8	2026-01-02 23:55:03.45-03
10	20260104121000_add_product_indexes.js	9	2026-01-04 12:11:26.928-03
11	20260104123700_create_pending_sales.js	10	2026-01-04 12:37:29.521-03
12	20260105140500_add_active_to_products.js	11	2026-01-05 11:05:17.047-03
13	20260105143700_add_active_to_categories.js	12	2026-01-05 11:37:30.935-03
14	20260105163400_add_promo_fields_to_products.js	13	2026-01-05 13:35:29.649-03
15	20260105163500_create_settings_table.js	13	2026-01-05 13:35:29.781-03
16	20260105163600_add_discount_fields_to_sales.js	13	2026-01-05 13:35:29.792-03
17	20260105175400_add_promo_type_to_products.js	14	2026-01-05 14:54:50.9-03
18	20260106123436_add_promo_details_to_sale_items.js	15	2026-01-06 09:35:46.897-03
19	20260106123456_add_promo_details_to_sale_items.js	15	2026-01-06 09:35:46.909-03
20	20260106123708_dummy.js	16	2026-01-06 09:37:59.313-03
21	20260106141512_add_sell_by_weight_to_sale_items.js	17	2026-01-06 11:20:50.077-03
22	20260107172437_create_businesses_table.js	18	2026-01-07 14:26:23.778-03
23	20260107172528_add_business_id_to_all_tables.js	18	2026-01-07 14:26:27.325-03
24	20260107173057_add_business_id_to_remaining_tables.js	19	2026-01-07 14:34:48.501-03
25	20260108131300_add_payment_fields_to_sales.js	20	2026-01-08 13:15:01.578-03
26	20260108134400_create_customer_account_transactions.js	21	2026-01-08 13:56:02.34-03
27	20260109224500_add_settled_at_to_sales.js	22	2026-01-09 22:49:37.955-03
28	20260110023954_add_credit_applied_to_sales.js	23	2026-01-09 23:40:22.912-03
34	20260110111021_add_active_and_notes_to_customers.js	24	2026-01-14 00:58:44.981-03
35	20260111013000_create_pending_sales_multiple.js	24	2026-01-14 00:58:45.051-03
36	20260114005429_create_purchases_table.js	24	2026-01-14 00:58:45.078-03
37	20260114005430_create_purchase_items_table.js	24	2026-01-14 00:58:45.1-03
38	20260114010747_create_cash_registers_table.js	25	2026-01-14 01:08:24.32-03
39	20260114010748_create_cash_movements_table.js	25	2026-01-14 01:08:24.363-03
40	20260114010749_add_cash_register_to_sales.js	25	2026-01-14 01:08:24.38-03
41	20260114014723_add_payment_methods_to_cash_registers.js	26	2026-01-14 01:47:46.662-03
42	20260114211000_add_payment_method_to_account_and_movements.js	27	2026-01-14 21:01:24.485-03
\.


--
-- TOC entry 5148 (class 0 OID 25840)
-- Dependencies: 232
-- Data for Name: knex_migrations_lock; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.knex_migrations_lock (index, is_locked) FROM stdin;
1	0
\.


--
-- TOC entry 5150 (class 0 OID 25845)
-- Dependencies: 234
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, message, is_read, type, created_at, business_id) FROM stdin;
1	1	aviso 1	t	nota	2025-12-29 15:32:15.829597-03	1
3	4	cobrar a miguel	t	nota	2025-12-30 16:17:17.623603-03	1
5	1	controlar faltante	t	nota	2026-01-03 00:46:23.584183-03	1
7	8	pruba	t	nota	2026-01-07 15:46:06.788165-03	1
6	8	prueba	t	nota	2026-01-07 15:44:48.271688-03	1
4	1	control de stock\n	t	nota	2025-12-31 21:15:59.073447-03	1
2	1	devolver pan viejo	t	nota	2025-12-30 15:08:11.104856-03	1
\.


--
-- TOC entry 5152 (class 0 OID 25857)
-- Dependencies: 236
-- Data for Name: pending_sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_sales (id, user_id, cart_data, customer_id, payment_method, updated_at, business_id) FROM stdin;
138	1	[{"id":28740,"name":"Rexona Efficient 100g","description":null,"sku":"7791293044477","price_buy":"2000.00","price_sell":"2500.00","stock":"3.000","category_id":33,"image_url":"/uploads/00f3b713-858d-4d4a-a8b5-a9b736a86cb3.jpg","created_at":"2026-01-17T14:47:56.339Z","updated_at":"2026-01-17T14:47:56.339Z","sell_by_weight":false,"price_offer":null,"is_offer":false,"active":true,"promo_buy":null,"promo_pay":null,"promo_type":"none","business_id":1,"category_name":"PERFUMERIA","quantity":1}]	2755	Efectivo	2026-01-17 12:54:10.922659-03	1
\.


--
-- TOC entry 5154 (class 0 OID 25868)
-- Dependencies: 238
-- Data for Name: pending_sales_multiple; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pending_sales_multiple (id, user_id, business_id, customer_id, payment_method, cart, created_at, updated_at) FROM stdin;
\.


--
-- TOC entry 5156 (class 0 OID 25880)
-- Dependencies: 240
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, description, sku, price_buy, price_sell, stock, category_id, image_url, created_at, updated_at, sell_by_weight, price_offer, is_offer, active, promo_buy, promo_pay, promo_type, business_id) FROM stdin;
28569	ALMACEN FATURAS MINI		FATURASSSS	2420.00	3000.00	-1.000	21	/uploads/FATURASSSS.jpg	2026-01-12 15:56:01.83843-03	2026-01-17 11:39:29.498764-03	f	\N	f	t	\N	\N	none	1
28570	ALMACEN MEDIALUNA		FATURASSSSSSSS	2750.00	3000.00	-69.000	21	/uploads/FATURASSSSSSSS.jpg	2026-01-12 15:56:01.841602-03	2026-01-17 11:39:29.501287-03	f	\N	f	t	\N	\N	none	1
28571	CHOCOLATES MILKA LECHE X20		MILKAAAAAA	0.00	0.00	0.000	32	/uploads/MILKAAAAAA.jpg	2026-01-12 15:56:01.844791-03	2026-01-17 11:39:29.504267-03	f	\N	f	t	\N	\N	none	1
27314	FIAMBRERIA SALAME 214	\N	FIAMBRE	14232.90	19500.00	2.200	20	/uploads/FIAMBRE.jpg	2026-01-12 15:55:57.416355-03	2026-01-17 11:39:25.398733-03	t	\N	f	t	\N	\N	none	1
28563	ALMACEN EMET MERMELADA		MERMELADASS	784.00	3712.50	6.000	21	/uploads/MERMELADASSSS.jpg	2026-01-12 15:56:01.820947-03	2026-01-12 15:56:01.820947-03	f	\N	f	t	\N	\N	none	1
28556	GALLETITAS PEPAS DE LA NONA X 350G		PEPASSSSS	935.00	1400.00	-4.000	25	/uploads/PEPASSSSS.jpg	2026-01-12 15:56:01.79507-03	2026-01-17 11:39:29.462416-03	f	\N	f	t	\N	\N	none	1
28557	GOLOSINAS LYL CHICLEEEEE		CHICLEEEEEEE	293.70	1000.00	23.000	18	/uploads/CHICLEEEEEEE.jpg	2026-01-12 15:56:01.802027-03	2026-01-17 11:39:29.46474-03	f	\N	f	t	\N	\N	none	1
28558	UNIDAD ENVASE PLASTICO		ENVASEE	1650.00	2000.00	-4.000	52	\N	2026-01-12 15:56:01.805049-03	2026-01-17 11:39:29.467272-03	f	\N	f	t	\N	\N	none	1
28559	FARMACIA AMOXIDAL 500		AMOXIDALLLLLL	266.20	500.00	-19.000	30	/uploads/AMOXIDALLLLLL.jpg	2026-01-12 15:56:01.807482-03	2026-01-17 11:39:29.469594-03	f	\N	f	t	\N	\N	none	1
28560	FARMACIA AMOXICILINA		AMOXICILINAAASS	168.30	400.00	6.000	30	/uploads/AMOXICILINAAASS.jpg	2026-01-12 15:56:01.810456-03	2026-01-17 11:39:29.471803-03	f	\N	f	t	\N	\N	none	1
28561	ART VARIOS BOMBILLA ROSARIO		BOMBILLAAAA	1551.00	2200.00	6.000	39	/uploads/BOMBILLAAAA.jpg	2026-01-12 15:56:01.81421-03	2026-01-17 11:39:29.474949-03	f	\N	f	t	\N	\N	none	1
28562	ART VARIOS GILLET ROJA		GILLETEEEEEE	1050.50	1500.00	0.000	39	/uploads/GILLETEEEEEE.jpg	2026-01-12 15:56:01.817496-03	2026-01-17 11:39:29.478275-03	f	\N	f	t	\N	\N	none	1
28564	BODEGA VINO ELEGIDO MALBEC		ELEGIDOOOOOO	3245.00	4000.00	0.000	37	/uploads/ELEGIDOOOOOO.jpg	2026-01-12 15:56:01.82487-03	2026-01-17 11:39:29.481855-03	f	\N	f	t	\N	\N	none	1
28565	ALMACEN CHEDAR LA TONADITA		CHEDARRRRRR	1540.00	2900.00	-1.000	21	/uploads/CHEDARRRRRR.jpg	2026-01-12 15:56:01.827467-03	2026-01-17 11:39:29.485526-03	f	\N	f	t	\N	\N	none	1
28566	ART.LIMPIEZA TOUCH  MINI		SAPHIRUSSSSS	2482.70	4300.00	3.000	29	/uploads/SAPHIRUSSSSS.jpg	2026-01-12 15:56:01.830069-03	2026-01-17 11:39:29.489131-03	f	\N	f	t	\N	\N	none	1
28567	ART.LIMPIEZA TOUCH REPUESTO		SAPHIRUSSSS	1749.00	2700.00	2.000	29	/uploads/SAPHIRUSSSS.jpg	2026-01-12 15:56:01.832984-03	2026-01-17 11:39:29.492002-03	f	\N	f	t	\N	\N	none	1
28568	ALMACEN TRENZAS		TRENZASSSSSS	2420.00	3000.00	-20.000	21	/uploads/TRENZASSSSSS.jpg	2026-01-12 15:56:01.835997-03	2026-01-17 11:39:29.49541-03	f	\N	f	t	\N	\N	none	1
26673	AGUA AGUA X6L		788814301505	1391.50	1800.00	2.000	23	/uploads/788814301505.jpg	2026-01-12 15:55:54.587439-03	2026-01-17 11:39:21.769062-03	f	\N	f	t	\N	\N	none	1
26768	ALMACEN CONDIMENTO TUCO Y GUISO ALICANTE		7790150496084	761.20	1000.00	7.000	21	/uploads/7790150496084.jpg	2026-01-12 15:55:55.193579-03	2026-01-17 11:39:22.370538-03	f	\N	f	t	\N	\N	none	1
26805	ALMACEN FILM ADERENTE 30M		7798110300020	810.70	1600.00	10.000	21	/uploads/7798110300020.jpg	2026-01-12 15:55:55.369352-03	2026-01-17 11:39:22.58514-03	f	\N	f	t	\N	\N	none	1
26910	ALMACEN POCHOCLOS ACARAMELADOS		7798112504150	0.00	0.00	0.000	21	/uploads/7798112504150.jpg	2026-01-12 15:55:55.802525-03	2026-01-17 11:39:23.217356-03	f	\N	f	t	\N	\N	none	1
28593	ART.LIMPIEZA DETERGENTE  ALA ..750ML		7791290793927	1650.00	2300.00	12.000	29	7791290793927.jpg	2026-01-17 11:39:23.81945-03	2026-01-17 11:39:23.81945-03	f	\N	f	t	\N	\N	none	1
28594	ART.LIMPIEZA JABON ALA LIQUIDO X800		7791290792012	2088.90	2800.00	-13.000	29	7791290792012.jpg	2026-01-17 11:39:24.143211-03	2026-01-17 11:39:24.143211-03	f	\N	f	t	\N	\N	none	1
28595	ART.LIMPIEZA LAVANDINA EN GEL AYUDIN		LAVANDINANNNN	2156.00	3300.00	5.000	29	LAVANDINANNNN.jpg	2026-01-17 11:39:24.249446-03	2026-01-17 11:39:24.249446-03	f	\N	f	t	\N	\N	none	1
27084	ART.LIMPIEZA POET SUAVIDAD DE ALGODON		7793253004262	1114.30	1850.00	-2.000	\N	/uploads/7793253004262.jpg	2026-01-12 15:55:56.431354-03	2026-01-17 11:39:24.356727-03	f	\N	f	t	\N	\N	none	1
27139	BODEGA CERV.QUILMES BOCK NEGRA		7792798007394	0.00	0.00	0.000	36	/uploads/7792798007394.jpg	2026-01-12 15:55:56.635296-03	2026-01-17 11:39:24.625597-03	f	\N	f	t	\N	\N	none	1
27230	CHOCOLATES BOCADITO MARROC		7790206006106	597.30	800.00	48.000	18	/uploads/7790206006106.jpg	2026-01-12 15:55:57.030064-03	2026-01-17 11:39:25.031558-03	f	\N	f	t	\N	\N	none	1
27378	GALLETITAS NS LINO Y CHIA		7798179490083	517.00	790.00	2.000	25	/uploads/7798179490083.jpg	2026-01-12 15:55:57.617602-03	2026-01-17 11:39:25.615188-03	f	\N	f	t	\N	\N	none	1
28596	GOLOSINAS TURRON DE MANI CON MIEL 280G		TURRONNNNNN	3121.80	3900.00	-5.000	18	TURRONNNNNN.jpg	2026-01-17 11:39:25.997018-03	2026-01-17 11:39:25.997018-03	f	\N	f	t	\N	\N	none	1
27500	LACTEOS FINLANDIA BALANCE X 290 G		7790742373403	3444.10	4300.00	1.000	26	/uploads/7790742373403.jpg	2026-01-12 15:55:58.067953-03	2026-01-17 11:39:26.0238-03	f	\N	f	t	\N	\N	none	1
28597	TOALLITAS TOALLITAS LINA		7794626011429	848.10	1100.00	5.000	66	7794626011429.jpg	2026-01-17 11:39:26.403684-03	2026-01-17 11:39:26.403684-03	f	\N	f	t	\N	\N	none	1
27611	UNIDAD FIAMBRERIA SALAMIN 214 X UNIDAD		7796804002014	3465.00	4300.00	5.000	20	/uploads/7796804002014.jpg	2026-01-12 15:55:58.458003-03	2026-01-17 11:39:26.444652-03	f	\N	f	t	\N	\N	none	1
27730	PERFUMERIA REXONA ANTIBACTERIAL 72HS		7791293045078	435.60	2000.00	3.000	33	/uploads/7791293045078.jpg	2026-01-12 15:55:58.8428-03	2026-01-17 11:39:26.94529-03	f	\N	f	t	\N	\N	none	1
28587	ALMACEN NUTELLA		NUTELLAAAAAA	3550.80	3800.00	1.000	21	/uploads/NUTELLAAAAAA.jpg	2026-01-12 15:56:01.894531-03	2026-01-17 11:39:29.544797-03	f	\N	f	t	\N	\N	none	1
28588	JUGUETES PISTOLA CONFITE ,DE AGUA		PISTOLAAAAAA	3850.00	4500.00	1.000	58	/uploads/PISTOLAAAAAA.jpg	2026-01-12 15:56:01.897222-03	2026-01-17 11:39:29.547044-03	f	\N	f	t	\N	\N	none	1
28589	JUGUETES CAMIONETAS 4X4		CAMIONETASSSS	6.60	8000.00	3.000	58	/uploads/CAMIONETASSSS.jpg	2026-01-12 15:56:01.900894-03	2026-01-17 11:39:29.549149-03	f	\N	f	t	\N	\N	none	1
28590	ALMACEN EL BIERZO		SALAMINNNNNN	2530.00	3100.00	3.000	21	\N	2026-01-12 15:56:01.903945-03	2026-01-17 11:39:29.551522-03	f	\N	f	t	\N	\N	none	1
28592	GALLETITAS TRAVIATAS KESITAS REX		TRAVIATASSSS	617.10	900.00	12.000	25	/uploads/TRAVIATASSSS.jpg	2026-01-12 15:56:01.909397-03	2026-01-17 11:39:29.553774-03	f	\N	f	t	\N	\N	none	1
28599	ALMACEN PAN DE FARGO		PANNNNNNNNNNN	1619.20	2000.00	2.000	21	PANNNNNNNNNNN.jpg	2026-01-17 11:39:29.556421-03	2026-01-17 11:39:29.556421-03	f	\N	f	t	\N	\N	none	1
28600	ALMACEN SESAMO BLANCO		SESAMOOOOOO	5467.00	7500.00	0.730	21	SESAMOOOOOO.jpg	2026-01-17 11:39:29.559867-03	2026-01-17 11:39:29.559867-03	f	\N	f	t	\N	\N	none	1
28601	ALMACEN CREMA CHANTILLY LEDEVIT		CHANTILLYYYYY	3256.00	4000.00	1.000	21	CHANTILLYYYYY.jpg	2026-01-17 11:39:29.562079-03	2026-01-17 11:39:29.562079-03	f	\N	f	t	\N	\N	none	1
28602	BODEGA 361 CERVEZA DESCARTABLE		CERVEZAAAAAA	1331.00	1750.00	6.000	37	CERVEZAAAAAA.jpg	2026-01-17 11:39:29.564519-03	2026-01-17 11:39:29.564519-03	f	\N	f	t	\N	\N	none	1
28603	GOLOSINAS GOMITAS MORITAS CHIQUITA X233		MORITASSSS	24.20	50.00	-112.000	18	MORITASSSS.jpg	2026-01-17 11:39:29.567647-03	2026-01-17 11:39:29.567647-03	f	\N	f	t	\N	\N	none	1
28604	ALMACEN CHEDAR FINLANDIA		CHEDDAR FINLANDIA	0.00	0.00	0.000	21	CHEDDAR FINLANDIA.jpg	2026-01-17 11:39:29.57056-03	2026-01-17 11:39:29.57056-03	f	\N	f	t	\N	\N	none	1
28605	ALMACEN TE VERDE		TEEE VERDE	1094.50	1400.00	1.000	21	TEEE VERDE.jpg	2026-01-17 11:39:29.573062-03	2026-01-17 11:39:29.573062-03	f	\N	f	t	\N	\N	none	1
28606	PERFUMERIA MACH TRES REPUESTOS		PRESTOBARBA	5383.40	6000.00	0.000	33	PRESTOBARBA.jpg	2026-01-17 11:39:29.576815-03	2026-01-17 11:39:29.576815-03	f	\N	f	t	\N	\N	none	1
28607	ALMACEN PANCITOS CHIPS		PANCITOSSSSSSS	1430.00	1800.00	1.000	21	PANCITOSSSSSSS.jpg	2026-01-17 11:39:29.579772-03	2026-01-17 11:39:29.579772-03	f	\N	f	t	\N	\N	none	1
28608	CONDIMENTOS PARA CARNES		CONDIMENTOSSSSSS	1030.70	1400.00	8.000	14	CONDIMENTOSSSSSS.jpg	2026-01-17 11:39:29.582608-03	2026-01-17 11:39:29.582608-03	f	\N	f	t	\N	\N	none	1
28591	ALMACEN GOMITAS MOGUL JELLI BEANS		MOGULLLLLLLLLLLL	599.00	2868.75	9.000	18	/uploads/MOGULLLLLLLLLLLL.jpg	2026-01-12 15:56:01.906077-03	2026-01-12 15:56:01.906077-03	f	\N	f	t	\N	\N	none	1
28609	CONDIMENTOS MIX CROCANTE PARA CARNES		CONDIMENTOSSSA	979.00	1250.00	3.000	14	CONDIMENTOSSSA.jpg	2026-01-17 11:39:29.585534-03	2026-01-17 11:39:29.585534-03	f	\N	f	t	\N	\N	none	1
28598	ART VARIOS FILTRO PARA BOMBILLA		4060978774101	352.00	600.00	3.000	39	4060978774101.jpg	2026-01-17 11:39:27.014003-03	2026-01-17 11:39:27.014003-03	f	\N	f	t	\N	\N	none	1
27860	CONGELADOS BIFE		CARNICERRIAAA	16280.00	16800.00	4.510	17	/uploads/CARNICERRIAAA.jpg	2026-01-12 15:55:59.397315-03	2026-01-17 11:39:27.326445-03	f	\N	f	t	\N	\N	none	1
27953	ALMACEN HARINA INTEGRAL  CHACABUCO		7799037060226	907.50	1150.00	2.000	21	/uploads/7799037060226.jpg	2026-01-12 15:55:59.75778-03	2026-01-17 11:39:27.614795-03	f	\N	f	t	\N	\N	none	1
28133	PANIFICADOS PAN INTEGRAL		PAN INTEGRAL	1760.00	2400.00	-4.000	45	/uploads/PAN INTEGRAL.jpg	2026-01-12 15:56:00.39141-03	2026-01-17 11:39:28.16936-03	f	\N	f	t	\N	\N	none	1
28153	GOLOSINAS CHUPETIN DOGGY POP		CHUPETINNNN	1991.00	2500.00	1.000	18	/uploads/CHUPETINNNN.jpg	2026-01-12 15:56:00.469875-03	2026-01-17 11:39:28.241577-03	f	\N	f	t	\N	\N	none	1
28156	GOLOSINAS CARAMELOS RODAJAS ACIDOS X 99 UNIDADES		CARAMELOSSSSS	52.80	75.00	91.000	18	/uploads/CARAMELOSSSSS.jpg	2026-01-12 15:56:00.481343-03	2026-01-17 11:39:28.247333-03	f	\N	f	t	\N	\N	none	1
28259	CIGARRILLOS MARLBORO CRAFTER CONVERTBLE		CIGARRILLOOOOOOOS	3421.00	3600.00	20.000	51	/uploads/CIGARRILLOOOOOOOS.jpg	2026-01-12 15:56:00.829443-03	2026-01-17 11:39:28.602696-03	f	\N	f	t	\N	\N	none	1
28572	LATAS REDBULL ENER		REDBULLLLLLL	2757.70	3300.00	0.000	47	/uploads/REDBULLLLLLL.jpg	2026-01-12 15:56:01.849477-03	2026-01-17 11:39:29.507421-03	f	\N	f	t	\N	\N	none	1
28573	LATAS DILEMA VINO		DILEMAAAAAA	1350.80	1700.00	1.000	47	/uploads/DILEMAAAAAA.jpg	2026-01-12 15:56:01.852592-03	2026-01-17 11:39:29.510071-03	f	\N	f	t	\N	\N	none	1
28574	LATAS TINTILLO MALBEC VINO SANTA JULIA		TINTILLOOOOOO	2019.60	2500.00	1.000	47	/uploads/TINTILLOOOOOO.jpg	2026-01-12 15:56:01.855383-03	2026-01-17 11:39:29.512784-03	f	\N	f	t	\N	\N	none	1
28575	LATAS SANTA JULIA VINO		ROSEEEEE	1777.60	2200.00	0.000	47	/uploads/ROSEEEEE.jpg	2026-01-12 15:56:01.858655-03	2026-01-17 11:39:29.515322-03	f	\N	f	t	\N	\N	none	1
28576	LATAS SMIRNOFF LATA		SMIRNOFFFFFF	2643.30	3250.00	2.000	47	/uploads/SMIRNOFFFFFF.jpg	2026-01-12 15:56:01.862581-03	2026-01-17 11:39:29.517749-03	f	\N	f	t	\N	\N	none	1
28577	CHOCOLATES MANI C/CHOCOLATE		MANIIIIIIIIII	830.50	1100.00	6.000	32	/uploads/MANIIIIIIIIII.jpg	2026-01-12 15:56:01.866073-03	2026-01-17 11:39:29.520322-03	f	\N	f	t	\N	\N	none	1
28578	CHOCOLATES MANI CON CHOCOLATE BLOK		MANICONCHOCOLATE	1226.50	1500.00	1.000	32	/uploads/MANICONCHOCOLATE.jpg	2026-01-12 15:56:01.868852-03	2026-01-17 11:39:29.522453-03	f	\N	f	t	\N	\N	none	1
28579	CHOCOLATES MISKY FAMILIAR		MISKYYYYYYY	1819.40	2500.00	-1.000	32	/uploads/MISKYYYYYYY.jpg	2026-01-12 15:56:01.87114-03	2026-01-17 11:39:29.52463-03	f	\N	f	t	\N	\N	none	1
28580	CHOCOLATES MINI TORTA BROWNIW		MINITORTAAAAAA	874.50	1100.00	-4.000	32	/uploads/MINITORTAAAAAA.jpg	2026-01-12 15:56:01.873198-03	2026-01-17 11:39:29.527307-03	f	\N	f	t	\N	\N	none	1
28581	ALMACEN PANCITOS NEGROS		PANCITOSSSS	2530.00	3500.00	0.100	21	/uploads/PANCITOSSSS.jpg	2026-01-12 15:56:01.875271-03	2026-01-17 11:39:29.530247-03	f	\N	f	t	\N	\N	none	1
28582	JUGUETES GURBUJAS		BURBUJEROOOOOO	1650.00	2500.00	0.000	44	/uploads/BURBUJEROOOOOO.jpg	2026-01-12 15:56:01.878552-03	2026-01-17 11:39:29.532844-03	f	\N	f	t	\N	\N	none	1
28583	JUGUETES PESCADOR		CANGREJOOOOO	2933.70	3500.00	7.000	58	/uploads/CANGREJOOOOO.jpg	2026-01-12 15:56:01.881884-03	2026-01-17 11:39:29.535914-03	f	\N	f	t	\N	\N	none	1
28584	GOLOSINAS CINTA ACIDAS GOMITAS		GOMITASSSSSSS	117.70	150.00	-66.000	18	/uploads/GOMITASSSSSSS.jpg	2026-01-12 15:56:01.88511-03	2026-01-17 11:39:29.538249-03	f	\N	f	t	\N	\N	none	1
28585	GALLETITAS SURTIDOS ANILLITOS		ANILLITOSSSSSS	1305.70	1700.00	2.000	25	/uploads/ANILLITOSSSSSS.jpg	2026-01-12 15:56:01.888279-03	2026-01-17 11:39:29.540439-03	f	\N	f	t	\N	\N	none	1
28586	ALMACEN BON O BON UNTABLE		BONOBONNNNNN	3800.50	4000.00	2.000	21	/uploads/BONOBONNNNNN.jpg	2026-01-12 15:56:01.891528-03	2026-01-17 11:39:29.542538-03	f	\N	f	t	\N	\N	none	1
28610	CONDIMENTOS MIX PICANTE		CONDIMENTTTT	941.60	1200.00	3.000	14	CONDIMENTTTT.jpg	2026-01-17 11:39:29.588024-03	2026-01-17 11:39:29.588024-03	f	\N	f	t	\N	\N	none	1
28611	CONDIMENTOS MIX ORIENTAL		CONDIMENTTT	941.60	1200.00	3.000	14	CONDIMENTTT.jpg	2026-01-17 11:39:29.590147-03	2026-01-17 11:39:29.590147-03	f	\N	f	t	\N	\N	none	1
28612	CONDIMENTOS FINAS HIERBAS		CONDIMENTOOOOO	941.60	1200.00	1.000	14	CONDIMENTOOOOO.jpg	2026-01-17 11:39:29.592223-03	2026-01-17 11:39:29.592223-03	f	\N	f	t	\N	\N	none	1
28613	CONDIMENTOS MIX BRASAS		CONDIMENTOOOOOOOOO	941.60	1200.00	3.000	14	CONDIMENTOOOOOOOOO.jpg	2026-01-17 11:39:29.594388-03	2026-01-17 11:39:29.594388-03	f	\N	f	t	\N	\N	none	1
28614	CONDIMENTOS CURRY		CONDIMENTOSOS	941.60	1200.00	3.000	14	CONDIMENTOSOS.jpg	2026-01-17 11:39:29.597349-03	2026-01-17 11:39:29.597349-03	f	\N	f	t	\N	\N	none	1
28615	CONDIMENTOS MIX ENSALADASSSS		MIXXXXXX	1998.70	2450.00	3.000	14	MIXXXXXX.jpg	2026-01-17 11:39:29.600591-03	2026-01-17 11:39:29.600591-03	f	\N	f	t	\N	\N	none	1
27672	ALMACEN PAN FLAUTA	\N	PANXKILO1234	1650.00	2000.00	-1.000	21	/uploads/PANXKILO1234.jpg	2026-01-12 15:55:58.652604-03	2026-01-17 11:39:26.762875-03	t	\N	f	t	\N	\N	none	1
26825	ALMACEN HARINA CAÑUELA 000 REFINADA	\N	7792180139320	768.90	950.00	2.000	21	/uploads/7792180139320.jpg	2026-01-12 15:55:55.450779-03	2026-01-17 11:39:22.689119-03	f	\N	f	t	\N	\N	none	1
28616	CONDIMENTOS MIX CRICANTE PARA ENSALADAS		CONDIIIIII	977.90	1250.00	3.000	14	CONDIIIIII.jpg	2026-01-17 11:39:29.604804-03	2026-01-17 11:39:29.604804-03	f	\N	f	t	\N	\N	none	1
28617	CONDIMENTOS MIX ENSALADAS Y SOPA		MIXXXXX	1797.40	2200.00	3.000	14	MIXXXXX.jpg	2026-01-17 11:39:29.608854-03	2026-01-17 11:39:29.608854-03	f	\N	f	t	\N	\N	none	1
28618	CONDIMENTOS MIX DESAYUNO		MIXXXXXXXXX	1712.70	2100.00	0.000	14	MIXXXXXXXXX.jpg	2026-01-17 11:39:29.612944-03	2026-01-17 11:39:29.612944-03	f	\N	f	t	\N	\N	none	1
28619	CONDIMENTOS MIX MULTI SEMILLAS		MIXXXXXXX	1977.80	2400.00	2.000	14	MIXXXXXXX.jpg	2026-01-17 11:39:29.616387-03	2026-01-17 11:39:29.616387-03	f	\N	f	t	\N	\N	none	1
28620	CONDIMENTOS ALBAHACA ALICANTE		CONDIMMMMM	713.90	950.00	10.000	14	CONDIMMMMM.jpg	2026-01-17 11:39:29.620129-03	2026-01-17 11:39:29.620129-03	f	\N	f	t	\N	\N	none	1
28621	ALMACEN SOPA NORK QUIK		SOPASSSSSS	2141.70	2650.00	8.000	21	SOPASSSSSS.jpg	2026-01-17 11:39:29.624667-03	2026-01-17 11:39:29.624667-03	f	\N	f	t	\N	\N	none	1
28622	ALMACEN COSITAS RICAS		BANDEJASSSSS	2420.00	3000.00	-46.000	21	BANDEJASSSSS.jpg	2026-01-17 11:39:29.631727-03	2026-01-17 11:39:29.631727-03	f	\N	f	t	\N	\N	none	1
28623	ALMACEN PIZA		PIZETASSSSSS	1320.00	1600.00	-13.000	21	PIZETASSSSSS.jpg	2026-01-17 11:39:29.635849-03	2026-01-17 11:39:29.635849-03	f	\N	f	t	\N	\N	none	1
28624	CEREALES ALMACEN FARGO  Y SEMILLAS		FARGOOOOO	2818.20	3500.00	4.000	21	FARGOOOOO.jpg	2026-01-17 11:39:29.640387-03	2026-01-17 11:39:29.640387-03	f	\N	f	t	\N	\N	none	1
28625	JUGUETES CUTE TOYS		1111111111	3850.00	5000.00	11.000	58	1111111111.jpg	2026-01-17 11:39:29.64575-03	2026-01-17 11:39:29.64575-03	f	\N	f	t	\N	\N	none	1
28626	GALLETITAS BOCA DE DAMA TERRABUSI		TERRABUSIIIII	1153.90	1600.00	6.000	25	TERRABUSIIIII.jpg	2026-01-17 11:39:29.650387-03	2026-01-17 11:39:29.650387-03	f	\N	f	t	\N	\N	none	1
28627	GOLOSINAS MONEDAS		MONEDASSSS	50.60	100.00	55.000	18	MONEDASSSS.jpg	2026-01-17 11:39:29.655795-03	2026-01-17 11:39:29.655795-03	f	\N	f	t	\N	\N	none	1
28628	ALMACEN PREPIZA LA SANTIAGUEÑAS X2		PREPIZAAAAA	1245.20	1700.00	0.000	21	PREPIZAAAAA.jpg	2026-01-17 11:39:29.661802-03	2026-01-17 11:39:29.661802-03	f	\N	f	t	\N	\N	none	1
28629	ALMACEN AZUFRE X5 UNIDADES		AZUFREREER	694.10	1000.00	9.000	21	AZUFREREER.jpg	2026-01-17 11:39:29.666167-03	2026-01-17 11:39:29.666167-03	f	\N	f	t	\N	\N	none	1
28630	CONDIMENTOS CONDIMENTO PARA HAMBURGUESAS		CONDIMENTOSSSSSSS	980.10	1300.00	2.000	14	CONDIMENTOSSSSSSS.jpg	2026-01-17 11:39:29.671694-03	2026-01-17 11:39:29.671694-03	f	\N	f	t	\N	\N	none	1
28631	GALLETITAS MAICENITAS URQUIZA		MAICENITASSSDDDD	546.70	650.00	14.000	25	MAICENITASSSDDDD.jpg	2026-01-17 11:39:29.676468-03	2026-01-17 11:39:29.676468-03	f	\N	f	t	\N	\N	none	1
28632	PIEZA ART.LIM LAMPAZO ROMYL SINTETICO		LAMPAZOOOOOOO	2695.00	3300.00	2.000	29	LAMPAZOOOOOOO.jpg	2026-01-17 11:39:29.679833-03	2026-01-17 11:39:29.679833-03	f	\N	f	t	\N	\N	none	1
28633	PIEZA ART.LIM PASTILLAS PARA HINODORO POET		PASTILLASSSSSS	2024.00	2500.00	1.000	29	PASTILLASSSSSS.jpg	2026-01-17 11:39:29.683973-03	2026-01-17 11:39:29.683973-03	f	\N	f	t	\N	\N	none	1
28634	ALMACEN CEBOLLA DESIDTATADA KNORR		CEBOLLAAAAAA	2011.90	2500.00	1.000	21	CEBOLLAAAAAA.jpg	2026-01-17 11:39:29.687004-03	2026-01-17 11:39:29.687004-03	f	\N	f	t	\N	\N	none	1
28635	ALMACEN MORRON DESHIDRATAD KNORR		MORRONNNNMM	3218.60	3950.00	2.000	21	MORRONNNNMM.jpg	2026-01-17 11:39:29.69026-03	2026-01-17 11:39:29.69026-03	f	\N	f	t	\N	\N	none	1
28636	ART VARIOS DECOLORANTE ISSUE		DECOLORANTEEEER	3206.50	4000.00	4.000	39	DECOLORANTEEEER.jpg	2026-01-17 11:39:29.694671-03	2026-01-17 11:39:29.694671-03	f	\N	f	t	\N	\N	none	1
28637	UNIDAD CREMONA		CREMONA	2200.00	2800.00	-2.000	52	CREMONA.jpg	2026-01-17 11:39:29.697618-03	2026-01-17 11:39:29.697618-03	f	\N	f	t	\N	\N	none	1
28638	ALMACEN FERNANDO		FERNANDOOOOO	1008.70	1200.00	-14.000	21	FERNANDOOOOO.jpg	2026-01-17 11:39:29.699891-03	2026-01-17 11:39:29.699891-03	f	\N	f	t	\N	\N	none	1
28639	ALMACEN YOGUR GRIEGO X300		YOGURRRRRRRR	3718.00	4500.00	4.000	21	YOGURRRRRRRR.jpg	2026-01-17 11:39:29.703176-03	2026-01-17 11:39:29.703176-03	f	\N	f	t	\N	\N	none	1
28640	ALMACEN YOGUR GRIEGO ARANDANOS		YOGURTTTTT	2340.80	2700.00	0.000	21	YOGURTTTTT.jpg	2026-01-17 11:39:29.705847-03	2026-01-17 11:39:29.705847-03	f	\N	f	t	\N	\N	none	1
28641	ALMACEN FRAGATA		FOSFOROOOOO	143.00	200.00	1.000	21	FOSFOROOOOO.jpg	2026-01-17 11:39:29.708048-03	2026-01-17 11:39:29.708048-03	f	\N	f	t	\N	\N	none	1
28642	ART.LIMPIEZA DECO ESENCIAS		BAGLESSSSS	6600.00	8500.00	2.000	29	BAGLESSSSS.jpg	2026-01-17 11:39:29.710168-03	2026-01-17 11:39:29.710168-03	f	\N	f	t	\N	\N	none	1
28643	GOLOSINAS DIENTES MOGUL GOMITAS 90 U		DIENTESSSSDS	59.40	100.00	-68.000	18	DIENTESSSSDS.jpg	2026-01-17 11:39:29.712222-03	2026-01-17 11:39:29.712222-03	f	\N	f	t	\N	\N	none	1
28644	GOLOSINAS ALFAJOR 9 DE ORO BROWNIE		BROWNIEEEEEEE	422.40	700.00	3.000	18	BROWNIEEEEEEE.jpg	2026-01-17 11:39:29.714658-03	2026-01-17 11:39:29.714658-03	f	\N	f	t	\N	\N	none	1
28645	ALMACEN KESITAS		KESITASSSSS	886.60	1150.00	16.000	21	KESITASSSSS.jpg	2026-01-17 11:39:29.721622-03	2026-01-17 11:39:29.721622-03	f	\N	f	t	\N	\N	none	1
28646	ALMACEN LA TOSCANA		OLIVAAAAAA	7991.50	9500.00	2.000	21	OLIVAAAAAA.jpg	2026-01-17 11:39:29.73408-03	2026-01-17 11:39:29.73408-03	f	\N	f	t	\N	\N	none	1
27521	PAPEL ELEGANTE X6		7793344904990	1540.00	2200.00	-2.000	31	/uploads/7793344904990.jpg	2026-01-12 15:55:58.140998-03	2026-01-17 11:39:26.086857-03	f	\N	f	t	\N	\N	none	1
28647	ALMACEN GRIEGO X 140G		YOGURRRRRR	1298.00	1600.00	1.000	21	YOGURRRRRR.jpg	2026-01-17 11:39:29.738748-03	2026-01-17 11:39:29.738748-03	f	\N	f	t	\N	\N	none	1
28648	ALMACEN PANAZO PAN. DE PANCHO		PANNNNNNNNM	1563.10	1900.00	0.000	21	PANNNNNNNNM.jpg	2026-01-17 11:39:29.741695-03	2026-01-17 11:39:29.741695-03	f	\N	f	t	\N	\N	none	1
28649	ALMACEN SUPERPANCHO		SALCHICHASSSS	1985.50	2400.00	-5.000	21	SALCHICHASSSS.jpg	2026-01-17 11:39:29.743986-03	2026-01-17 11:39:29.743986-03	f	\N	f	t	\N	\N	none	1
28650	GOLOSINAS GUAYMALLEN TRUPLE		GUAYMALLENNNNNNN	382.80	500.00	24.000	18	GUAYMALLENNNNNNN.jpg	2026-01-17 11:39:29.746407-03	2026-01-17 11:39:29.746407-03	f	\N	f	t	\N	\N	none	1
28651	GOLOSINAS GULA		GULAAAAAAA	976.80	1200.00	-7.000	18	GULAAAAAAA.jpg	2026-01-17 11:39:29.748495-03	2026-01-17 11:39:29.748495-03	f	\N	f	t	\N	\N	none	1
28652	ALMACEN KING MANI		KINGGGGGGG	869.00	1100.00	3.000	21	KINGGGGGGG.jpg	2026-01-17 11:39:29.7509-03	2026-01-17 11:39:29.7509-03	f	\N	f	t	\N	\N	none	1
28653	ALMACEN MANI KING SABORIZADOS		MANIIIIIIII	1129.70	1500.00	-3.000	21	MANIIIIIIII.jpg	2026-01-17 11:39:29.753021-03	2026-01-17 11:39:29.753021-03	f	\N	f	t	\N	\N	none	1
28654	GALLETITAS SIN SAL GRANIX		SINSALLLLLL	1020.80	1300.00	0.000	25	SINSALLLLLL.jpg	2026-01-17 11:39:29.755265-03	2026-01-17 11:39:29.755265-03	f	\N	f	t	\N	\N	none	1
28655	PERFUMERIA DOVE DESODORANTE MUJER		DOVEEEE	3598.10	4200.00	2.000	33	DOVEEEE.jpg	2026-01-17 11:39:29.761432-03	2026-01-17 11:39:29.761432-03	f	\N	f	t	\N	\N	none	1
28656	GASEOSAS SCHWEPPES POMELO		SCHWEPPESSSSS	1247.40	1600.00	0.000	49	SCHWEPPESSSSS.jpg	2026-01-17 11:39:29.763902-03	2026-01-17 11:39:29.763902-03	f	\N	f	t	\N	\N	none	1
28657	GOLOSINAS RASTA TRI COLOR		RASTATRICOLOR	1202.30	1600.00	-1.000	18	RASTATRICOLOR.jpg	2026-01-17 11:39:29.767188-03	2026-01-17 11:39:29.767188-03	f	\N	f	t	\N	\N	none	1
28658	ART.LIMPIEZA JABON GRAMBI		GRAMBIIIIIII	1744.60	2200.00	8.000	29	GRAMBIIIIIII.jpg	2026-01-17 11:39:29.769457-03	2026-01-17 11:39:29.769457-03	f	\N	f	t	\N	\N	none	1
28659	JUGUETES PLAYLIFE MASA ULTRA LIVIANA		PLYLIFEEEEEERRRRRR	2750.00	5000.00	-3.000	58	PLYLIFEEEEEERRRRRR.jpg	2026-01-17 11:39:29.771538-03	2026-01-17 11:39:29.771538-03	f	\N	f	t	\N	\N	none	1
28660	HELADERIA PALITO DE AGUA		HELADOO	231.00	400.00	3.000	65	HELADOO.jpg	2026-01-17 11:39:29.773589-03	2026-01-17 11:39:29.773589-03	f	\N	f	t	\N	\N	none	1
28661	HELADERIA BOMBON PALITO		HELADOSSS	495.00	750.00	-35.000	65	HELADOSSS.jpg	2026-01-17 11:39:29.777204-03	2026-01-17 11:39:29.777204-03	f	\N	f	t	\N	\N	none	1
28662	HELADERIA FUSION PALITO		HELADOSSSS	385.00	600.00	4.000	65	HELADOSSSS.jpg	2026-01-17 11:39:29.779369-03	2026-01-17 11:39:29.779369-03	f	\N	f	t	\N	\N	none	1
28663	HELADERIA CROCANTE BOMBON		HELADOSSSSA	671.00	900.00	2.000	65	HELADOSSSSA.jpg	2026-01-17 11:39:29.781644-03	2026-01-17 11:39:29.781644-03	f	\N	f	t	\N	\N	none	1
28664	HELADERIA CREMA TSUNAMI		HELADOSSSE	385.00	600.00	-52.000	65	HELADOSSSE.jpg	2026-01-17 11:39:29.783711-03	2026-01-17 11:39:29.783711-03	f	\N	f	t	\N	\N	none	1
28665	HELADERIA RELLENO BOMBOM		HELADOSSSSSDTR	797.50	1100.00	-8.000	65	HELADOSSSSSDTR.jpg	2026-01-17 11:39:29.786079-03	2026-01-17 11:39:29.786079-03	f	\N	f	t	\N	\N	none	1
28666	HELADERIA 1/4 DE ELADOS		HELADERIAAAAAASA	1815.00	4500.00	-19.000	65	HELADERIAAAAAASA.jpg	2026-01-17 11:39:29.788501-03	2026-01-17 11:39:29.788501-03	f	\N	f	t	\N	\N	none	1
28667	HELADERIA 1/2 DE HELADOSS		HELADERIAAAAA	3630.00	7500.00	-12.000	65	HELADERIAAAAA.jpg	2026-01-17 11:39:29.790864-03	2026-01-17 11:39:29.790864-03	f	\N	f	t	\N	\N	none	1
28668	HELADERIA 1K HELADO		HELADERIAAAS	7260.00	13000.00	-7.000	65	HELADERIAAAS.jpg	2026-01-17 11:39:29.792947-03	2026-01-17 11:39:29.792947-03	f	\N	f	t	\N	\N	none	1
28669	CIGARRILLOS MARLBORO DE UVA DE 12		MARLBOROOOOO	3542.00	3750.00	6.000	51	MARLBOROOOOO.jpg	2026-01-17 11:39:29.79543-03	2026-01-17 11:39:29.79543-03	f	\N	f	t	\N	\N	none	1
28670	ALMACEN YOGUR SER		SERRRRR	2255.00	2700.00	1.000	21	SERRRRR.jpg	2026-01-17 11:39:29.798034-03	2026-01-17 11:39:29.798034-03	f	\N	f	t	\N	\N	none	1
28671	ALMACEN PAN INTEGRAL		PANNNNNNNCT	1783.10	2200.00	1.000	21	PANNNNNNNCT.jpg	2026-01-17 11:39:29.800125-03	2026-01-17 11:39:29.800125-03	f	\N	f	t	\N	\N	none	1
28672	PERFUMERIA PLUSBELLE		PLUSBELLEEEEEE	1375.00	2000.00	3.000	33	PLUSBELLEEEEEE.jpg	2026-01-17 11:39:29.802175-03	2026-01-17 11:39:29.802175-03	f	\N	f	t	\N	\N	none	1
28673	PERFUMERIA QUE LINDA		QUELINDAAAAQ	573.10	900.00	3.000	33	QUELINDAAAAQ.jpg	2026-01-17 11:39:29.804372-03	2026-01-17 11:39:29.804372-03	f	\N	f	t	\N	\N	none	1
28674	LATAS CERVEZA PAMPA	R	CERVEZAPAMPA	811.80	1200.00	-21.000	47	CERVEZAPAMPA.jpg	2026-01-17 11:39:29.806738-03	2026-01-17 11:39:29.806738-03	f	\N	f	t	\N	\N	none	1
28675	ALMACEN JUGOS ADES		ADESSSS	806.30	1000.00	2.000	21	ADESSSS.jpg	2026-01-17 11:39:29.809967-03	2026-01-17 11:39:29.809967-03	f	\N	f	t	\N	\N	none	1
28676	ALMACEN GRIEGO X190		YOGURTTTT	2281.40	2600.00	1.000	21	YOGURTTTT.jpg	2026-01-17 11:39:29.812168-03	2026-01-17 11:39:29.812168-03	f	\N	f	t	\N	\N	none	1
28677	ALMACEN HUEVO BLANCO		HUEVOOOOOOII	169.40	230.00	6.000	21	HUEVOOOOOOII.jpg	2026-01-17 11:39:29.814297-03	2026-01-17 11:39:29.814297-03	f	\N	f	t	\N	\N	none	1
28678	TOALLITAS LADYSOFT ULTRA		7790250097587	1098.90	1400.00	4.000	66	7790250097587.jpg	2026-01-17 11:39:29.816945-03	2026-01-17 11:39:29.816945-03	f	\N	f	t	\N	\N	none	1
28679	TOALLITAS LADYSOFT COMFORT SOFT		7790250097617	770.00	1200.00	2.000	66	7790250097617.jpg	2026-01-17 11:39:29.819256-03	2026-01-17 11:39:29.819256-03	f	\N	f	t	\N	\N	none	1
28680	TOALLITAS CALIPSO		7790770602070	603.90	1100.00	6.990	66	7790770602070.jpg	2026-01-17 11:39:29.821318-03	2026-01-17 11:39:29.821318-03	f	\N	f	t	\N	\N	none	1
28681	TOALLITAS LADYSOFT		7790250097556	1428.90	1800.00	-2.000	66	7790250097556.jpg	2026-01-17 11:39:29.823374-03	2026-01-17 11:39:29.823374-03	f	\N	f	t	\N	\N	none	1
28682	TOALLITAS LADYSIFT .		7790250097648	770.00	1200.00	0.000	66	7790250097648.jpg	2026-01-17 11:39:29.825662-03	2026-01-17 11:39:29.825662-03	f	\N	f	t	\N	\N	none	1
28683	PERFUMERIA DOREE CREMA OXIDANTE NORMAL 20		7794050007210	658.90	1000.00	1.000	33	7794050007210.jpg	2026-01-17 11:39:29.827978-03	2026-01-17 11:39:29.827978-03	f	\N	f	t	\N	\N	none	1
28684	PERFUMERIA DOREE NORMAL 30		7794050007241	701.80	1000.00	3.000	33	7794050007241.jpg	2026-01-17 11:39:29.829998-03	2026-01-17 11:39:29.829998-03	f	\N	f	t	\N	\N	none	1
28685	PERFUMERIA JABON QUE LINDA		6799049449072	1089.00	1500.00	2.000	33	6799049449072.jpg	2026-01-17 11:39:29.832093-03	2026-01-17 11:39:29.832093-03	f	\N	f	t	\N	\N	none	1
28686	TOALLITAS LINA C/A		7794626012808	409.20	800.00	35.000	66	7794626012808.jpg	2026-01-17 11:39:29.834075-03	2026-01-17 11:39:29.834075-03	f	\N	f	t	\N	\N	none	1
28687	BEBIDA ESTRELLA DEL SUR CERVEZA		8410793206121	1098.90	1500.00	1.000	19	8410793206121.jpg	2026-01-17 11:39:29.83676-03	2026-01-17 11:39:29.83676-03	f	\N	f	t	\N	\N	none	1
28688	MASCOTAS ALIMENTO MATUTE		MATUTE	935.00	1300.00	7.840	15	MATUTE.jpg	2026-01-17 11:39:29.83915-03	2026-01-17 11:39:29.83915-03	f	\N	f	t	\N	\N	none	1
28689	GOLOSINAS MOGUL JELLYBEAN GOMITAS		JELLYBEANS	11712.80	20000.00	1.295	18	JELLYBEANS.jpg	2026-01-17 11:39:29.842232-03	2026-01-17 11:39:29.842232-03	f	\N	f	t	\N	\N	none	1
28690	BEBIDA GANCIA SIN ALCOHOL 473		GANCIAAAA	1465.20	2000.00	4.000	19	GANCIAAAA.jpg	2026-01-17 11:39:29.844779-03	2026-01-17 11:39:29.844779-03	f	\N	f	t	\N	\N	none	1
28691	ART VARIOS PEGAMENTO RAPI PEGA SOLUCION		7798045860927	858.00	1300.00	10.000	39	7798045860927.jpg	2026-01-17 11:39:29.846977-03	2026-01-17 11:39:29.846977-03	f	\N	f	t	\N	\N	none	1
28692	ART VARIOS TERMOMETRO DIGITAL		7798033100608	2805.00	4000.00	2.000	39	7798033100608.jpg	2026-01-17 11:39:29.849132-03	2026-01-17 11:39:29.849132-03	f	\N	f	t	\N	\N	none	1
28693	ART VARIOS GANCHOS ABROCHADORA		7798006050084	1265.00	2000.00	5.000	39	7798006050084.jpg	2026-01-17 11:39:29.851249-03	2026-01-17 11:39:29.851249-03	f	\N	f	t	\N	\N	none	1
28694	ART VARIOS AGUJAS		AGUJASSSS	330.00	600.00	6.000	39	AGUJASSSS.jpg	2026-01-17 11:39:29.853372-03	2026-01-17 11:39:29.853372-03	f	\N	f	t	\N	\N	none	1
28695	ART VARIOS CINTA AISLADORA 10M		CINTAAAAAAQ	1045.00	1500.00	4.000	39	CINTAAAAAAQ.jpg	2026-01-17 11:39:29.856261-03	2026-01-17 11:39:29.856261-03	f	\N	f	t	\N	\N	none	1
28696	ART VARIOS EQUIPO DE CICLISTA SOLUKIT		CICLISTAAAA	1485.00	2000.00	2.000	39	CICLISTAAAA.jpg	2026-01-17 11:39:29.859708-03	2026-01-17 11:39:29.859708-03	f	\N	f	t	\N	\N	none	1
28697	ART VARIOS TARJETA SUBE		SUBEEEEEE	2695.00	3000.00	2.000	39	SUBEEEEEE.jpg	2026-01-17 11:39:29.862095-03	2026-01-17 11:39:29.862095-03	f	\N	f	t	\N	\N	none	1
26710	ALMACEN ATUN LOMITO CUMANA		7791885004094	1731.00	8268.75	-3.000	21	/uploads/7791885004094.jpg	2026-01-12 15:55:54.788272-03	2026-01-12 15:55:54.788272-03	f	\N	f	t	\N	\N	none	1
26675	AGUA ENR.GATORADE X750		7792170052271	2051.50	2750.00	5.000	16	/uploads/7792170052271.jpg	2026-01-12 15:55:54.600766-03	2026-01-17 11:39:21.789434-03	f	\N	f	t	\N	\N	none	1
26680	AGUA JUGUITO CHICO		7790036000695	0.00	0.00	0.000	\N	/uploads/7790036000695.jpg	2026-01-12 15:55:54.631105-03	2026-01-17 11:39:21.820584-03	f	\N	f	t	\N	\N	none	1
26684	ALMACEN ACEITE CAÑUELA DE 1,5LTS		7792180001665	0.00	0.00	0.000	21	/uploads/7792180001665.jpg	2026-01-12 15:55:54.658617-03	2026-01-17 11:39:21.853973-03	f	\N	f	t	\N	\N	none	1
26689	ALMACEN ACEITE NATURA X900		7790272001005	3230.70	3950.00	8.000	21	/uploads/7790272001005.jpg	2026-01-12 15:55:54.687867-03	2026-01-17 11:39:21.891356-03	f	\N	f	t	\N	\N	none	1
26694	ALMACEN ARLISTAN CAFE X 170 G		7790070936479	0.00	0.00	0.000	21	/uploads/7790070936479.jpg	2026-01-12 15:55:54.714531-03	2026-01-17 11:39:21.924412-03	f	\N	f	t	\N	\N	none	1
26699	ALMACEN ARROZ MOLINO ALA NO SE PASA X 500G		7791120037566	1298.00	1680.00	2.000	21	/uploads/7791120037566.jpg	2026-01-12 15:55:54.740798-03	2026-01-17 11:39:21.960541-03	f	\N	f	t	\N	\N	none	1
26705	ALMACEN ARROZ VANGUARDIA X 1KG		7798078450126	878.90	2000.00	-22.000	21	/uploads/7798078450126.jpg	2026-01-12 15:55:54.765555-03	2026-01-17 11:39:21.996329-03	f	\N	f	t	\N	\N	none	1
26716	ALMACEN AZUCAR IMPALPABLE X300		7792900092898	2234.10	2750.00	6.000	21	/uploads/7792900092898.jpg	2026-01-12 15:55:54.821481-03	2026-01-17 11:39:22.073384-03	f	\N	f	t	\N	\N	none	1
26721	ALMACEN BANDEJAS		BANDEJAS112234	1980.00	2600.00	0.000	21	/uploads/BANDEJAS112234.jpg	2026-01-12 15:55:54.848817-03	2026-01-17 11:39:22.097645-03	f	\N	f	t	\N	\N	none	1
26726	ALMACEN BISCOCHUELO RAVANA DE CHOCOLATE		7790971000194	2118.60	2600.00	4.000	21	/uploads/7790971000194.jpg	2026-01-12 15:55:54.869876-03	2026-01-17 11:39:22.128253-03	f	\N	f	t	\N	\N	none	1
26731	ALMACEN BOSA P/ HORNO POLLO		7794000004924	0.00	0.00	0.000	21	/uploads/7794000004924.jpg	2026-01-12 15:55:54.983107-03	2026-01-17 11:39:22.153673-03	f	\N	f	t	\N	\N	none	1
26732	ALMACEN BUDIN CON CHIP		7795735601075	1100.00	1800.00	6.000	21	/uploads/7795735601075.jpg	2026-01-12 15:55:54.987827-03	2026-01-17 11:39:22.160044-03	f	\N	f	t	\N	\N	none	1
26734	ALMACEN CABALLA AL NATURAL CUMANA		7791885005459	3696.00	4400.00	0.000	21	/uploads/7791885005459.jpg	2026-01-12 15:55:54.996949-03	2026-01-17 11:39:22.172044-03	f	\N	f	t	\N	\N	none	1
26740	ALMACEN CAFE LA VIRGINIA X50		7790150100677	1556.50	1950.00	0.000	41	/uploads/7790150100677.jpg	2026-01-12 15:55:55.028491-03	2026-01-17 11:39:22.20871-03	f	\N	f	t	\N	\N	none	1
26746	ALMACEN CALDO KNORR		7794000003798	0.00	0.00	0.000	21	/uploads/7794000003798.jpg	2026-01-12 15:55:55.10446-03	2026-01-17 11:39:22.244154-03	f	\N	f	t	\N	\N	none	1
26750	ALMACEN CAPUCHINO LA MORENITA		7790170907478	2548.70	3300.00	1.000	21	/uploads/7790170907478.jpg	2026-01-12 15:55:55.121646-03	2026-01-17 11:39:22.265232-03	f	\N	f	t	\N	\N	none	1
26757	ALMACEN CHICITOS FRIT BON		7798006430107	0.00	0.00	0.000	21	/uploads/7798006430107.jpg	2026-01-12 15:55:55.148551-03	2026-01-17 11:39:22.305152-03	f	\N	f	t	\N	\N	none	1
26762	ALMACEN CHOCLO CUMANA X320G		7791885003493	1147.30	1500.00	2.000	21	/uploads/7791885003493.jpg	2026-01-12 15:55:55.167499-03	2026-01-17 11:39:22.334937-03	f	\N	f	t	\N	\N	none	1
26767	ALMACEN CONDIMENTO EMPANADA ALICANTE		7790150497272	951.50	1200.00	9.000	21	/uploads/7790150497272.jpg	2026-01-12 15:55:55.188807-03	2026-01-17 11:39:22.36397-03	f	\N	f	t	\N	\N	none	1
26772	ALMACEN DULCE DE LECHE REPOSTERO		7795170000143	1771.00	2200.00	24.000	21	/uploads/7795170000143.jpg	2026-01-12 15:55:55.209838-03	2026-01-17 11:39:22.395552-03	f	\N	f	t	\N	\N	none	1
26778	ALMACEN ESCARBADIENTES ALADINO		7790900006723	534.60	700.00	11.000	21	/uploads/7790900006723.jpg	2026-01-12 15:55:55.236945-03	2026-01-17 11:39:22.432288-03	f	\N	f	t	\N	\N	none	1
26783	ALMACEN FIDEO A LA BUENA DE DIOS GUISO		7794711000024	0.00	0.00	0.000	21	/uploads/7794711000024.jpg	2026-01-12 15:55:55.258334-03	2026-01-17 11:39:22.461662-03	f	\N	f	t	\N	\N	none	1
26788	ALMACEN FIDEOS  MATARAZO MUNICIONES		7790070320032	0.00	0.00	0.000	21	/uploads/7790070320032.jpg	2026-01-12 15:55:55.284551-03	2026-01-17 11:39:22.48891-03	f	\N	f	t	\N	\N	none	1
26795	ALMACEN FIDEOS LUCCHETTI		7790070318398	0.00	0.00	0.000	21	/uploads/7790070318398.jpg	2026-01-12 15:55:55.321159-03	2026-01-17 11:39:22.528802-03	f	\N	f	t	\N	\N	none	1
26800	ALMACEN FIDEOS MATARAZZO TALLARIN		7790070318657	0.00	0.00	0.000	21	/uploads/7790070318657.jpg	2026-01-12 15:55:55.345221-03	2026-01-17 11:39:22.556864-03	f	\N	f	t	\N	\N	none	1
26810	ALMACEN GELATINA DE FRUTILLA		7790971002327	715.00	1000.00	3.000	21	/uploads/7790971002327.jpg	2026-01-12 15:55:55.39615-03	2026-01-17 11:39:22.613409-03	f	\N	f	t	\N	\N	none	1
26816	ALMACEN GOOD SHOW		7798112300592	0.00	0.00	0.000	21	/uploads/7798112300592.jpg	2026-01-12 15:55:55.419318-03	2026-01-17 11:39:22.636115-03	f	\N	f	t	\N	\N	none	1
26821	ALMACEN GRASA		GRASBACUNA111111	0.00	0.00	0.000	21	/uploads/GRASBACUNA111111.jpg	2026-01-12 15:55:55.439639-03	2026-01-17 11:39:22.663046-03	f	\N	f	t	\N	\N	none	1
26826	ALMACEN HARINA CAÑUELAS LEUDANTE		7792180136961	0.00	0.00	0.000	21	/uploads/7792180136961.jpg	2026-01-12 15:55:55.454016-03	2026-01-17 11:39:22.695176-03	f	\N	f	t	\N	\N	none	1
26831	ALMACEN HARINA PUREZA PIZZA		7792180004567	1483.90	1850.00	-3.000	21	/uploads/7792180004567.jpg	2026-01-12 15:55:55.468222-03	2026-01-17 11:39:22.722698-03	f	\N	f	t	\N	\N	none	1
26837	ALMACEN HILO NEGRO BLANCO		11111111122222	275.00	600.00	9.000	21	/uploads/11111111122222.jpg	2026-01-12 15:55:55.485372-03	2026-01-17 11:39:22.755821-03	f	\N	f	t	\N	\N	none	1
26843	ALMACEN JUGOS SOBRE		JUGOS CLIGHT	398.20	500.00	-44.000	21	/uploads/JUGOS CLIGHT.jpg	2026-01-12 15:55:55.503554-03	2026-01-17 11:39:22.787757-03	f	\N	f	t	\N	\N	none	1
26848	ALMACEN LEQ PANCETITAS		7797429004018	679.80	850.00	1.000	21	/uploads/7797429004018.jpg	2026-01-12 15:55:55.519919-03	2026-01-17 11:39:22.81404-03	f	\N	f	t	\N	\N	none	1
26850	ALMACEN MAIZ BLANCO PISADO		7798032180625	964.70	1200.00	3.000	21	/uploads/7798032180625.jpg	2026-01-12 15:55:55.525416-03	2026-01-17 11:39:22.824567-03	f	\N	f	t	\N	\N	none	1
26854	ALMACEN MANI CON CASCARA X100G		7797429007101	4983.00	6500.00	-1.570	21	/uploads/7797429007101.jpg	2026-01-12 15:55:55.539205-03	2026-01-17 11:39:22.85005-03	f	\N	f	t	\N	\N	none	1
26860	ALMACEN MAYONESA HELLMANN'S		7794000004818	628.10	850.00	-10.000	21	/uploads/7794000004818.jpg	2026-01-12 15:55:55.560964-03	2026-01-17 11:39:22.886847-03	f	\N	f	t	\N	\N	none	1
26865	ALMACEN MAYONESA NATURA X500G		7791866001364	2264.90	2850.00	1.000	21	/uploads/7791866001364.jpg	2026-01-12 15:55:55.581739-03	2026-01-17 11:39:22.913346-03	f	\N	f	t	\N	\N	none	1
26871	ALMACEN MERMELADAS		MERMELADASEMET	2142.80	2700.00	0.000	21	/uploads/MERMELADASEMET.jpg	2026-01-12 15:55:55.606687-03	2026-01-17 11:39:22.938252-03	f	\N	f	t	\N	\N	none	1
26876	ALMACEN MINI CORONITAS SNACK		7790369008061	0.00	0.00	0.000	21	/uploads/7790369008061.jpg	2026-01-12 15:55:55.629032-03	2026-01-17 11:39:22.977756-03	f	\N	f	t	\N	\N	none	1
26881	ALMACEN NESCAFE DOLCA CAPUCHINO		8445290256355	0.00	0.00	0.000	21	/uploads/8445290256355.jpg	2026-01-12 15:55:55.65187-03	2026-01-17 11:39:23.008828-03	f	\N	f	t	\N	\N	none	1
26885	ALMACEN PALITOS  FRITBON		7798006430138	794.20	1000.00	8.000	21	/uploads/7798006430138.jpg	2026-01-12 15:55:55.664272-03	2026-01-17 11:39:23.034549-03	f	\N	f	t	\N	\N	none	1
26890	ALMACEN LACTAL PAN DE SALVADO CHICO		7796854000169	1890.90	2350.00	1.000	21	/uploads/7796854000169.jpg	2026-01-12 15:55:55.680058-03	2026-01-17 11:39:23.06327-03	f	\N	f	t	\N	\N	none	1
26896	ALMACEN PAN RALLADO HORNO		7792180004789	922.90	1200.00	8.000	21	/uploads/7792180004789.jpg	2026-01-12 15:55:55.707698-03	2026-01-17 11:39:23.114737-03	f	\N	f	t	\N	\N	none	1
26900	ALMACEN PAPAS FRITAS PEHUAMAR X100G		7790310984130	15576.00	19500.00	5.000	21	/uploads/7790310984130.jpg	2026-01-12 15:55:55.768264-03	2026-01-17 11:39:23.140453-03	f	\N	f	t	\N	\N	none	1
26906	ALMACEN PICKLES MIXTOS DALOMO		7798125550359	0.00	0.00	0.000	21	/uploads/7798125550359.jpg	2026-01-12 15:55:55.787178-03	2026-01-17 11:39:23.17727-03	f	\N	f	t	\N	\N	none	1
26909	ALMACEN PIPAS GIGANTES		7798044150555	764.50	1000.00	3.000	21	/uploads/7798044150555.jpg	2026-01-12 15:55:55.799369-03	2026-01-17 11:39:23.202267-03	f	\N	f	t	\N	\N	none	1
26998	ART VARIOS LAMPARAS LED CANDELA		7798347080061	927.00	6075.00	0.000	39	/uploads/7798347080061.jpg	2026-01-12 15:55:56.103414-03	2026-01-12 15:55:56.103414-03	f	\N	f	t	\N	\N	none	1
26914	ALMACEN POSTRE RAVÀNA CHOCOLATE Y VAINILLA		7790971002402	0.00	0.00	0.000	21	/uploads/7790971002402.jpg	2026-01-12 15:55:55.815572-03	2026-01-17 11:39:23.254305-03	f	\N	f	t	\N	\N	none	1
26921	ALMACEN QUESO CLASICO  LIGHT LA SERENISIMA X290G		7791337005464	1665.40	2000.00	0.000	21	/uploads/7791337005464.jpg	2026-01-12 15:55:55.842355-03	2026-01-17 11:39:23.303856-03	f	\N	f	t	\N	\N	none	1
26927	ALMACEN SAL FINA CELUSAL		7790072001014	1098.90	1450.00	6.000	21	/uploads/7790072001014.jpg	2026-01-12 15:55:55.860811-03	2026-01-17 11:39:23.34984-03	f	\N	f	t	\N	\N	none	1
26931	ALMACEN SALSA 4 QUESOS ALICANTE		7790150586044	1450.90	1800.00	2.000	21	/uploads/7790150586044.jpg	2026-01-12 15:55:55.872606-03	2026-01-17 11:39:23.381557-03	f	\N	f	t	\N	\N	none	1
26936	ALMACEN SALSA LISTA PIZZA		7794000003699	1316.70	1700.00	4.000	21	/uploads/7794000003699.jpg	2026-01-12 15:55:55.886105-03	2026-01-17 11:39:23.421755-03	f	\N	f	t	\N	\N	none	1
26942	ALMACEN SI DIET X200 ML		7790036948188	944.90	1800.00	3.000	21	/uploads/7790036948188.jpg	2026-01-12 15:55:55.90405-03	2026-01-17 11:39:23.448817-03	f	\N	f	t	\N	\N	none	1
26946	ALMACEN TE  MANZANILLA CON ANIS LA VIRGINIA		7790150331088	770.00	800.00	1.000	21	/uploads/7790150331088.jpg	2026-01-12 15:55:55.924092-03	2026-01-17 11:39:23.470093-03	f	\N	f	t	\N	\N	none	1
26952	ALMACEN TE DE MANZANILLA TARAGUI		7790387000283	96.80	285.00	6.000	21	/uploads/7790387000283.jpg	2026-01-12 15:55:55.947213-03	2026-01-17 11:39:23.50235-03	f	\N	f	t	\N	\N	none	1
26957	ALMACEN TE VERDE LA VIRGINIA		7790150355077	0.00	0.00	3.000	21	/uploads/7790150355077.jpg	2026-01-12 15:55:55.961832-03	2026-01-17 11:39:23.526962-03	f	\N	f	t	\N	\N	none	1
26962	ALMACEN TOMATE PERITA INCA		7790790120738	0.00	0.00	100.000	21	/uploads/7790790120738.jpg	2026-01-12 15:55:55.976231-03	2026-01-17 11:39:23.555212-03	f	\N	f	t	\N	\N	none	1
26966	ALMACEN TOMATE TRITURADO INCA   BOTELLA		7798144510464	2142.80	2700.00	11.000	21	/uploads/7798144510464.jpg	2026-01-12 15:55:55.989103-03	2026-01-17 11:39:23.576955-03	f	\N	f	t	\N	\N	none	1
26968	ALMACEN TORTILLAS ORALI		7791218123799	1234.20	1600.00	5.000	21	/uploads/7791218123799.jpg	2026-01-12 15:55:55.995052-03	2026-01-17 11:39:23.586715-03	f	\N	f	t	\N	\N	none	1
26969	ALMACEN TOSTADAS DE ARROZ		7798142880019	0.00	0.00	0.000	21	/uploads/7798142880019.jpg	2026-01-12 15:55:55.998359-03	2026-01-17 11:39:23.591624-03	f	\N	f	t	\N	\N	none	1
26975	ALMACEN VINAGRE X 1 LITRO		7792378000937	1045.00	1400.00	8.000	21	/uploads/7792378000937.jpg	2026-01-12 15:55:56.016319-03	2026-01-17 11:39:23.625621-03	f	\N	f	t	\N	\N	none	1
26980	ALMACEN YERBA CBSE  STEVIA CORMILLOT		7790710334665	1475.10	2100.00	4.000	21	/uploads/7790710334665.jpg	2026-01-12 15:55:56.036245-03	2026-01-17 11:39:23.652258-03	f	\N	f	t	\N	\N	none	1
26985	ALMACEN YERBA NOBLEZA GAUCHA		7790070507112	209.00	456.00	1.000	21	/uploads/7790070507112.jpg	2026-01-12 15:55:56.05209-03	2026-01-17 11:39:23.679387-03	f	\N	f	t	\N	\N	none	1
26990	ALMACEN YERBA UNION	Los precios adicionales es 1 predio de compra 2de venta compré en oferta	7790387014624	1809.50	2300.00	7.000	21	/uploads/7790387014624.jpg	2026-01-12 15:55:56.068948-03	2026-01-17 11:39:23.705662-03	f	\N	f	t	\N	\N	none	1
27003	ART VARIOS PILAS CR2032		4902580131258	0.00	0.00	0.000	39	/uploads/4902580131258.jpg	2026-01-12 15:55:56.12598-03	2026-01-17 11:39:23.766396-03	f	\N	f	t	\N	\N	none	1
27009	ART.LIMPIEZA ACONDICIONADOR SEDALX190ML		7791293030654	1531.20	1900.00	0.000	29	/uploads/7791293030654.jpg	2026-01-12 15:55:56.147896-03	2026-01-17 11:39:23.797759-03	f	\N	f	t	\N	\N	none	1
27014	ART.LIMPIEZA APARATO PARA TABLETAS RAID		7790520995384	7997.00	8500.00	2.000	29	/uploads/7790520995384.jpg	2026-01-12 15:55:56.1711-03	2026-01-17 11:39:23.813671-03	f	\N	f	t	\N	\N	none	1
27019	ART.LIMPIEZA BOLSA RESIDUO 50X70		7798158390021	762.30	1200.00	1.000	29	/uploads/7798158390021.jpg	2026-01-12 15:55:56.189634-03	2026-01-17 11:39:23.847691-03	f	\N	f	t	\N	\N	none	1
27025	ART.LIMPIEZA CAMELLITO ROA FINA 120ML		7791290009776	12.10	798.00	1.000	22	/uploads/7791290009776.jpg	2026-01-12 15:55:56.20912-03	2026-01-17 11:39:23.881948-03	f	\N	f	t	\N	\N	none	1
27026	ART.LIMPIEZA CERAMICOL AUTOBRILLO		7790520995650	228.80	307.80	3.000	29	/uploads/7790520995650.jpg	2026-01-12 15:55:56.212337-03	2026-01-17 11:39:23.886994-03	f	\N	f	t	\N	\N	none	1
27028	ART.LIMPIEZA CIF GATILLO		7791290789906	0.00	0.00	0.000	29	/uploads/7791290789906.jpg	2026-01-12 15:55:56.217675-03	2026-01-17 11:39:23.897633-03	f	\N	f	t	\N	\N	none	1
27033	ART.LIMPIEZA DESINFECTANTE DUPLEX		7798049448923	165.00	444.60	3.000	29	/uploads/7798049448923.jpg	2026-01-12 15:55:56.230802-03	2026-01-17 11:39:23.926354-03	f	\N	f	t	\N	\N	none	1
27039	PIEZA ART.LIM ESPIRALES X12 RAID		7790520010445	734.80	1150.00	13.000	29	/uploads/7790520010445.jpg	2026-01-12 15:55:56.250153-03	2026-01-17 11:39:24.040721-03	f	\N	f	t	\N	\N	none	1
27044	ART.LIMPIEZA GUANTES PATITO N8		7798008381513	3300.00	3600.00	5.000	29	/uploads/7798008381513.jpg	2026-01-12 15:55:56.307532-03	2026-01-17 11:39:24.108981-03	f	\N	f	t	\N	\N	none	1
27049	ART.LIMPIEZA JABON EMPOLVO MATIC		7791290792098	174.90	1200.00	0.000	29	/uploads/7791290792098.jpg	2026-01-12 15:55:56.32416-03	2026-01-17 11:39:24.150777-03	f	\N	f	t	\N	\N	none	1
27054	ART.LIMPIEZA JABON LIQUIDO DRIVE X 400ML		7791290790391	176.00	215.46	11.000	29	/uploads/7791290790391.jpg	2026-01-12 15:55:56.339079-03	2026-01-17 11:39:24.187125-03	f	\N	f	t	\N	\N	none	1
27060	ART.LIMPIEZA JABON TOCADOR REXONA		7791293031941	880.00	2300.00	6.000	29	/uploads/7791293031941.jpg	2026-01-12 15:55:56.355643-03	2026-01-17 11:39:24.223515-03	f	\N	f	t	\N	\N	none	1
27065	ART.LIMPIEZA LAVANDINA HOGAR		7798095440070	598.40	750.00	1.000	29	/uploads/7798095440070.jpg	2026-01-12 15:55:56.370127-03	2026-01-17 11:39:24.257077-03	f	\N	f	t	\N	\N	none	1
27070	ART.LIMPIEZA LYSOFORM AEROSOL		7790520014221	357.50	4900.00	1.000	22	/uploads/7790520014221.jpg	2026-01-12 15:55:56.384655-03	2026-01-17 11:39:24.283945-03	f	\N	f	t	\N	\N	none	1
27076	ART.LIMPIEZA ODEX DESINFECTANTE		7791905004516	132.00	182.40	3.000	29	/uploads/7791905004516.jpg	2026-01-12 15:55:56.401852-03	2026-01-17 11:39:24.313898-03	f	\N	f	t	\N	\N	none	1
27081	PIEZA ART.LIM PAÑO MEDIA NARANJA		7790927817128	790.90	1100.00	4.000	29	/uploads/7790927817128.jpg	2026-01-12 15:55:56.422351-03	2026-01-17 11:39:24.339546-03	f	\N	f	t	\N	\N	none	1
27083	ART.LIMPIEZA PILAS ENERGIZER AA X 1		8999002671962	792.00	1000.00	-29.000	29	/uploads/8999002671962.jpg	2026-01-12 15:55:56.428071-03	2026-01-17 11:39:24.35128-03	f	\N	f	t	\N	\N	none	1
27090	ART.LIMPIEZA RAID CUCARACHAS		7790520017574	0.00	0.00	0.000	22	/uploads/7790520017574.jpg	2026-01-12 15:55:56.449825-03	2026-01-17 11:39:24.391513-03	f	\N	f	t	\N	\N	none	1
27095	ART.LIMPIEZA REJILLA MEDIA NARANJA		7798136921704	0.00	0.00	5.000	29	/uploads/7798136921704.jpg	2026-01-12 15:55:56.464994-03	2026-01-17 11:39:24.418269-03	f	\N	f	t	\N	\N	none	1
27101	ART.LIMPIEZA SHAMPOO PANTEN		7500435012256	968.00	1356.60	3.000	29	/uploads/7500435012256.jpg	2026-01-12 15:55:56.481133-03	2026-01-17 11:39:24.447736-03	f	\N	f	t	\N	\N	none	1
27108	BEBIDA CEPITA X200		7790895641596	770.00	1000.00	0.000	44	/uploads/7790895641596.jpg	2026-01-12 15:55:56.512265-03	2026-01-17 11:39:24.473067-03	f	\N	f	t	\N	\N	none	1
27113	BODEGA .FERNET X750		7790290101602	14960.00	16600.00	7.000	24	/uploads/7790290101602.jpg	2026-01-12 15:55:56.530408-03	2026-01-17 11:39:24.495491-03	f	\N	f	t	\N	\N	none	1
27118	BODEGA AP.CINZANO		7791200200552	7324.90	8800.00	2.000	24	/uploads/7791200200552.jpg	2026-01-12 15:55:56.549833-03	2026-01-17 11:39:24.517474-03	f	\N	f	t	\N	\N	none	1
27123	BODEGA AP.SIDRA DEL VALLE		7790154000652	3758.70	4600.00	12.000	24	/uploads/7790154000652.jpg	2026-01-12 15:55:56.578724-03	2026-01-17 11:39:24.539553-03	f	\N	f	t	\N	\N	none	1
27128	BODEGA CERV AMSTEL LAGER		7793147572044	319.00	410.40	6.000	47	/uploads/7793147572044.jpg	2026-01-12 15:55:56.602897-03	2026-01-17 11:39:24.562146-03	f	\N	f	t	\N	\N	none	1
27133	BODEGA LATON  SCHNEIDER 710		7793147570606	2435.40	3000.00	6.000	36	/uploads/7793147570606.jpg	2026-01-12 15:55:56.61874-03	2026-01-17 11:39:24.590965-03	f	\N	f	t	\N	\N	none	1
27142	LITRO BODEGA CERV.STELLA ARTOIS X1		7792798006199	4061.20	4900.00	-21.000	36	/uploads/7792798006199.jpg	2026-01-12 15:55:56.643092-03	2026-01-17 11:39:24.643177-03	f	\N	f	t	\N	\N	none	1
27145	BODEGA CUSENIER		7792410008259	440.00	469.68	1.000	21	/uploads/7792410008259.jpg	2026-01-12 15:55:56.657724-03	2026-01-17 11:39:24.655986-03	f	\N	f	t	\N	\N	none	1
27150	BODEGA DOBLE MALTA QUILMES		7792798011513	0.00	0.00	0.000	37	/uploads/7792798011513.jpg	2026-01-12 15:55:56.681573-03	2026-01-17 11:39:24.678629-03	f	\N	f	t	\N	\N	none	1
27155	BODEGA ENERGIY RED BULL		9002490248949	209.00	228.00	1.000	16	/uploads/9002490248949.jpg	2026-01-12 15:55:56.703549-03	2026-01-17 11:39:24.692364-03	f	\N	f	t	\N	\N	none	1
27159	BODEGA FEDERICO DE ALVEAR EXTRA BRUT		7790480008940	4175.60	6500.00	9.000	24	/uploads/7790480008940.jpg	2026-01-12 15:55:56.721702-03	2026-01-17 11:39:24.71285-03	f	\N	f	t	\N	\N	none	1
27165	BODEGA HEINEKEN		7793147000899	0.00	0.00	0.000	36	/uploads/7793147000899.jpg	2026-01-12 15:55:56.748298-03	2026-01-17 11:39:24.7432-03	f	\N	f	t	\N	\N	none	1
27169	BODEGA ISRNBECK		7793147570835	126.50	296.40	6.000	37	/uploads/7793147570835.jpg	2026-01-12 15:55:56.765795-03	2026-01-17 11:39:24.761968-03	f	\N	f	t	\N	\N	none	1
27174	BODEGA CERV GROLSCH		7793147570866	143.00	171.00	1.000	36	/uploads/7793147570866.jpg	2026-01-12 15:55:56.785779-03	2026-01-17 11:39:24.784126-03	f	\N	f	t	\N	\N	none	1
27179	BODEGA CERV .BRAMA		7792798005888	1431.10	1900.00	-46.000	36	/uploads/7792798005888.jpg	2026-01-12 15:55:56.805612-03	2026-01-17 11:39:24.804018-03	f	\N	f	t	\N	\N	none	1
27184	BODEGA NEW AGE		7790703165207	294.80	316.92	1.000	12	/uploads/7790703165207.jpg	2026-01-12 15:55:56.826783-03	2026-01-17 11:39:24.823418-03	f	\N	f	t	\N	\N	none	1
27189	BODEGA SIDRA PATAGONIA		7792798011117	242.00	319.20	1.000	37	/uploads/7792798011117.jpg	2026-01-12 15:55:56.85052-03	2026-01-17 11:39:24.845826-03	f	\N	f	t	\N	\N	none	1
27194	BODEGA VINO ALMA MORA		4790700042108	4398.90	5500.00	11.000	12	/uploads/4790700042108.jpg	2026-01-12 15:55:56.869165-03	2026-01-17 11:39:24.871532-03	f	\N	f	t	\N	\N	none	1
27199	BODEGA VINO COLON MALBEC		7790168114000	418.00	855.00	6.000	12	/uploads/7790168114000.jpg	2026-01-12 15:55:56.88772-03	2026-01-17 11:39:24.897079-03	f	\N	f	t	\N	\N	none	1
27203	BODEGA VINO DADA N8		7791540049590	4181.10	5200.00	0.000	12	/uploads/7791540049590.jpg	2026-01-12 15:55:56.906009-03	2026-01-17 11:39:24.915082-03	f	\N	f	t	\N	\N	none	1
27204	BODEGA VINO DON VALENTIN LACRADO		7790703100321	3289.00	4000.00	5.000	12	/uploads/7790703100321.jpg	2026-01-12 15:55:56.910858-03	2026-01-17 11:39:24.919955-03	f	\N	f	t	\N	\N	none	1
27209	BODEGA VINO OTRO LOCO MAS		7795232000524	1403.60	2000.00	6.000	12	/uploads/7795232000524.jpg	2026-01-12 15:55:56.935207-03	2026-01-17 11:39:24.940761-03	f	\N	f	t	\N	\N	none	1
27214	BODEGA VINO SAN HUBERTO MALBEC		7790945006153	1394.80	1960.80	-1.000	12	/uploads/7790945006153.jpg	2026-01-12 15:55:56.957689-03	2026-01-17 11:39:24.96018-03	f	\N	f	t	\N	\N	none	1
27220	BODEGA VINO UVITA		7790036044323	1455.30	2100.00	-2.000	12	/uploads/7790036044323.jpg	2026-01-12 15:55:56.988433-03	2026-01-17 11:39:24.984239-03	f	\N	f	t	\N	\N	none	1
27225	BODEGA WHISKY DOBLE -V		7791560000366	154.00	165.30	1.000	24	/uploads/7791560000366.jpg	2026-01-12 15:55:57.009865-03	2026-01-17 11:39:25.008858-03	f	\N	f	t	\N	\N	none	1
27235	CHOCOLATES CHOCOLATE CON LECHE Y MANI FELFORT		7790206514397	176.00	285.00	1.000	32	/uploads/7790206514397.jpg	2026-01-12 15:55:57.051545-03	2026-01-17 11:39:25.049077-03	f	\N	f	t	\N	\N	none	1
27242	CHOCOLATES DOS CORAZONES		7790206007509	1082.40	1450.00	11.000	18	/uploads/7790206007509.jpg	2026-01-12 15:55:57.081424-03	2026-01-17 11:39:25.074453-03	f	\N	f	t	\N	\N	none	1
27247	CHOCOLATES MILKA LEGER LECHE X 110G		7622201812744	2392.50	3000.00	0.000	32	/uploads/7622201812744.jpg	2026-01-12 15:55:57.102712-03	2026-01-17 11:39:25.100843-03	f	\N	f	t	\N	\N	none	1
27252	CHOCOLATES TAZA AGUILA FRACCIONADO POR BARITA		7790407031273	4796.00	6000.00	0.000	32	/uploads/7790407031273.jpg	2026-01-12 15:55:57.151762-03	2026-01-17 11:39:25.127931-03	f	\N	f	t	\N	\N	none	1
27259	CONDIMENTOS BICARBONATO DE SODIO		7798137920157	0.00	0.00	3.000	14	/uploads/7798137920157.jpg	2026-01-12 15:55:57.18101-03	2026-01-17 11:39:25.159379-03	f	\N	f	t	\N	\N	none	1
27261	CONDIMENTOS COMINO		7790150465400	744.70	1000.00	10.000	14	/uploads/7790150465400.jpg	2026-01-12 15:55:57.190552-03	2026-01-17 11:39:25.165941-03	f	\N	f	t	\N	\N	none	1
27262	CONDIMENTOS CONDIMENTO P/ARROZ		7790150470350	885.50	1200.00	9.000	14	/uploads/7790150470350.jpg	2026-01-12 15:55:57.19754-03	2026-01-17 11:39:25.168645-03	f	\N	f	t	\N	\N	none	1
27267	CONDIMENTOS OREGANO ALICANTE X 25G		7790150540183	1155.00	1500.00	3.000	14	/uploads/7790150540183.jpg	2026-01-12 15:55:57.222853-03	2026-01-17 11:39:25.190584-03	f	\N	f	t	\N	\N	none	1
27272	CONDIMENTOS PIMIENTA NEGRA		7790150555446	1122.00	1400.00	3.000	14	/uploads/7790150555446.jpg	2026-01-12 15:55:57.250043-03	2026-01-17 11:39:25.206956-03	f	\N	f	t	\N	\N	none	1
27277	FARMACIA BAYASPIRINA PASTILLAS X BLISTER		7793640000747	125.40	200.00	8.000	30	/uploads/7793640000747.jpg	2026-01-12 15:55:57.272933-03	2026-01-17 11:39:25.22407-03	f	\N	f	t	\N	\N	none	1
27283	FARMACIA IBU 600 SINDOL		7791829019450	0.00	0.00	0.000	30	/uploads/7791829019450.jpg	2026-01-12 15:55:57.295736-03	2026-01-17 11:39:25.258246-03	f	\N	f	t	\N	\N	none	1
27289	FARMACIA ROLFITA C		FARMACIAAA	0.00	0.00	0.000	30	/uploads/FARMACIAAA.jpg	2026-01-12 15:55:57.31584-03	2026-01-17 11:39:25.290484-03	f	\N	f	t	\N	\N	none	1
27294	FARMACIA TAFIROL FORTE 650		33344444	196.90	350.00	13.000	30	/uploads/33344444.jpg	2026-01-12 15:55:57.336435-03	2026-01-17 11:39:25.318127-03	f	\N	f	t	\N	\N	none	1
27300	FIAMBRERIA BONDIOLA LUVIANKA		FIAMBRE BON	21817.40	30000.00	0.910	20	/uploads/FIAMBRE BON.jpg	2026-01-12 15:55:57.361385-03	2026-01-17 11:39:25.340636-03	f	\N	f	t	\N	\N	none	1
27304	FIAMBRERIA LONGANIZA		LONGANIZA 214 X 100 G	18040.00	24000.00	1.140	20	/uploads/LONGANIZA 214 X 100 G.jpg	2026-01-12 15:55:57.377653-03	2026-01-17 11:39:25.35488-03	f	\N	f	t	\N	\N	none	1
27311	FIAMBRERIA QUESO MUZARELA BARRAZA		FIAMBRESSS	10346.60	15000.00	1.492	20	/uploads/FIAMBRESSS.jpg	2026-01-12 15:55:57.402958-03	2026-01-17 11:39:25.3864-03	f	\N	f	t	\N	\N	none	1
27317	FRESCOS DELICIA		7791620001029	88.00	108.30	3.000	42	/uploads/7791620001029.jpg	2026-01-12 15:55:57.425543-03	2026-01-17 11:39:25.406998-03	f	\N	f	t	\N	\N	none	1
27321	FRESCOS SALCHICHAS CHAMPION X12		7796804047022	2483.80	3200.00	12.000	42	/uploads/7796804047022.jpg	2026-01-12 15:55:57.437653-03	2026-01-17 11:39:25.418726-03	f	\N	f	t	\N	\N	none	1
27325	FRESCOS TAPA PASCUALINA HOJAL		7791218000052	1417.90	1650.00	0.000	21	/uploads/7791218000052.jpg	2026-01-12 15:55:57.449279-03	2026-01-17 11:39:25.431261-03	f	\N	f	t	\N	\N	none	1
27330	GALLETITAS ALFAJOR JORGITO X6		7790957000538	1848.00	2350.00	3.000	25	/uploads/7790957000538.jpg	2026-01-12 15:55:57.462677-03	2026-01-17 11:39:25.449747-03	f	\N	f	t	\N	\N	none	1
27336	GALLETITAS BIZCOCHO NEGRITO DON SATUR		7795735000342	929.50	1200.00	-4.000	25	/uploads/7795735000342.jpg	2026-01-12 15:55:57.478124-03	2026-01-17 11:39:25.468672-03	f	\N	f	t	\N	\N	none	1
27341	GALLETITAS BUDIN POZO		7790077001095	786.50	1000.00	41.000	25	/uploads/7790077001095.jpg	2026-01-12 15:55:57.491326-03	2026-01-17 11:39:25.485151-03	f	\N	f	t	\N	\N	none	1
27346	GALLETITAS CHOCOLINAS X170		7790040929906	1162.70	1500.00	14.000	25	/uploads/7790040929906.jpg	2026-01-12 15:55:57.503862-03	2026-01-17 11:39:25.501475-03	f	\N	f	t	\N	\N	none	1
27351	GALLETITAS DIVERSION SURTIDAS		7790040132764	1859.00	2300.00	-1.000	25	/uploads/7790040132764.jpg	2026-01-12 15:55:57.518895-03	2026-01-17 11:39:25.515547-03	f	\N	f	t	\N	\N	none	1
27356	GALLETITAS GALLEGUITAS CLASICAS		7795733001075	644.60	900.00	6.000	25	/uploads/7795733001075.jpg	2026-01-12 15:55:57.531326-03	2026-01-17 11:39:25.529942-03	f	\N	f	t	\N	\N	none	1
27362	GALLETITAS MAGDALENAS POZO		7790077000364	1353.00	1650.00	-3.000	25	/uploads/7790077000364.jpg	2026-01-12 15:55:57.549817-03	2026-01-17 11:39:25.553171-03	f	\N	f	t	\N	\N	none	1
27368	GALLETITAS MEMBRILLITO X200GMS		7795733001082	764.50	1000.00	28.000	25	/uploads/7795733001082.jpg	2026-01-12 15:55:57.578002-03	2026-01-17 11:39:25.571206-03	f	\N	f	t	\N	\N	none	1
27374	GALLETITAS MINIOREO		7622300841461	772.20	1100.00	4.000	25	/uploads/7622300841461.jpg	2026-01-12 15:55:57.600242-03	2026-01-17 11:39:25.598626-03	f	\N	f	t	\N	\N	none	1
27438	GOLOSINAS ALFAJOR TERRABUSI BLANCO GLASEADO		7622300202859	0.00	0.00	0.000	18	/uploads/7622300202859.jpg	2026-01-12 15:55:57.88029-03	2026-01-12 15:55:57.88029-03	f	\N	f	t	\N	\N	none	1
27596	PERFUMERIA TOALLITAS LADISOFT ULTRA DELGADA		7790250097433	0.00	0.00	0.000	33	/uploads/7790250097433.jpg	2026-01-12 15:55:58.400003-03	2026-01-12 15:55:58.400003-03	f	\N	f	t	\N	\N	none	1
27379	GALLETITAS NS MIX DE SEMILLAS		7798179490212	517.00	790.00	10.000	25	/uploads/7798179490212.jpg	2026-01-12 15:55:57.622046-03	2026-01-17 11:39:25.621428-03	f	\N	f	t	\N	\N	none	1
27382	GALLETITAS OPERA X55G		77903501	587.40	800.00	-1.000	25	/uploads/77903501.jpg	2026-01-12 15:55:57.664714-03	2026-01-17 11:39:25.637734-03	f	\N	f	t	\N	\N	none	1
27386	GALLETITAS PAN DULCE C/F DON  SATUR		815781010014	3792.80	4250.00	4.000	25	/uploads/815781010014.jpg	2026-01-12 15:55:57.676655-03	2026-01-17 11:39:25.649728-03	f	\N	f	t	\N	\N	none	1
27393	GALLETITAS PEPAS TRIO X 300G		7791787000705	770.00	1000.00	-5.000	25	/uploads/7791787000705.jpg	2026-01-12 15:55:57.704832-03	2026-01-17 11:39:25.669019-03	f	\N	f	t	\N	\N	none	1
27398	GALLETITAS RC CHICAS		7790697000522	1104.40	1350.00	22.000	25	/uploads/7790697000522.jpg	2026-01-12 15:55:57.736007-03	2026-01-17 11:39:25.688682-03	f	\N	f	t	\N	\N	none	1
27403	GALLETITAS SURTIDAS TERRABUSI VARIEDAD		7622201804435	2222.00	2850.00	0.000	25	/uploads/7622201804435.jpg	2026-01-12 15:55:57.760312-03	2026-01-17 11:39:25.705042-03	f	\N	f	t	\N	\N	none	1
27409	GALLETITAS VAINILLAS MAURI		7790628102684	345.40	600.00	30.000	25	/uploads/7790628102684.jpg	2026-01-12 15:55:57.788323-03	2026-01-17 11:39:25.724839-03	f	\N	f	t	\N	\N	none	1
27415	GASEOSAS GAS.7UP		7791813777052	2651.00	3300.00	-9.000	49	/uploads/7791813777052.jpg	2026-01-12 15:55:57.806901-03	2026-01-17 11:39:25.743898-03	f	\N	f	t	\N	\N	none	1
27419	GASEOSAS GAS.CUNINGTO POMELO		7790639001310	96.80	307.80	6.000	49	/uploads/7790639001310.jpg	2026-01-12 15:55:57.822974-03	2026-01-17 11:39:25.764895-03	f	\N	f	t	\N	\N	none	1
27425	GOLOSINAS ALFAJOR FANTOCHE TRIPLE		77991584	0.00	0.00	12.000	18	/uploads/77991584.jpg	2026-01-12 15:55:57.844187-03	2026-01-17 11:39:25.784713-03	f	\N	f	t	\N	\N	none	1
27430	GOLOSINAS ALFAJOR JORGITO FRUTA		77905734	565.40	750.00	-16.000	18	/uploads/77905734.jpg	2026-01-12 15:55:57.860646-03	2026-01-17 11:39:25.798514-03	f	\N	f	t	\N	\N	none	1
27436	GOLOSINAS ALFAJOR OREO TRIPLE		77976307	1008.70	1300.00	3.000	18	/uploads/77976307.jpg	2026-01-12 15:55:57.875409-03	2026-01-17 11:39:25.814799-03	f	\N	f	t	\N	\N	none	1
27440	GOLOSINAS ALFAJOR TOFI  EL NEGRO Y BLANCO  TRIPLE		7790040484801	399.30	650.00	-15.000	18	/uploads/7790040484801.jpg	2026-01-12 15:55:57.885205-03	2026-01-17 11:39:25.826492-03	f	\N	f	t	\N	\N	none	1
27448	GOLOSINAS BUTTER TOFFES CHOCOLATE		CARAMELO DE CHOCOLATE	34.10	50.00	105.000	18	/uploads/CARAMELO DE CHOCOLATE.jpg	2026-01-12 15:55:57.904262-03	2026-01-17 11:39:25.857221-03	f	\N	f	t	\N	\N	none	1
27453	GOLOSINAS CARAMELOS PALITOS DE LA SELVA		7622201802592	50.60	100.00	183.000	18	/uploads/7622201802592.jpg	2026-01-12 15:55:57.918887-03	2026-01-17 11:39:25.88778-03	f	\N	f	t	\N	\N	none	1
27459	GOLOSINAS FLIMPAF 70 UNIDADES	Bulto x68 unidades	7790380002734	82.50	100.00	75.000	18	/uploads/7790380002734.jpg	2026-01-12 15:55:57.941564-03	2026-01-17 11:39:25.908208-03	f	\N	f	t	\N	\N	none	1
27464	GOLOSINAS GOMITAS GOMUL TUTTI FRUTTI		7790580129354	49.50	77.52	10.000	18	/uploads/7790580129354.jpg	2026-01-12 15:55:57.954295-03	2026-01-17 11:39:25.921923-03	f	\N	f	t	\N	\N	none	1
27469	GOLOSINAS MANI CON CHOCOLATE GEORGALOS		7790380037736	0.00	0.00	3.000	18	/uploads/7790380037736.jpg	2026-01-12 15:55:57.968534-03	2026-01-17 11:39:25.93941-03	f	\N	f	t	\N	\N	none	1
27474	GOLOSINAS MILKA LEGER ALMENDRAS X 110GS		7622201812805	0.00	0.00	0.000	18	/uploads/7622201812805.jpg	2026-01-12 15:55:57.981025-03	2026-01-17 11:39:25.949608-03	f	\N	f	t	\N	\N	none	1
27480	GOLOSINAS PICO DULCE		CHUPETIN	143.00	250.00	5.000	18	/uploads/CHUPETIN.jpg	2026-01-12 15:55:57.998507-03	2026-01-17 11:39:25.969279-03	f	\N	f	t	\N	\N	none	1
27485	GOLOSINAS TEMBLEKE GOMITAS		7791359120015	79.20	100.00	0.000	18	/uploads/7791359120015.jpg	2026-01-12 15:55:58.014207-03	2026-01-17 11:39:25.98649-03	f	\N	f	t	\N	\N	none	1
27491	GOLOSINAS TURRON SERENATA		7790380012146	0.00	0.00	0.000	18	/uploads/7790380012146.jpg	2026-01-12 15:55:58.038409-03	2026-01-17 11:39:26.007415-03	f	\N	f	t	\N	\N	none	1
27495	HELADOS HELADO TASA X 360GS		7798152491120	1155.00	1600.00	-1.000	65	/uploads/7798152491120.jpg	2026-01-12 15:55:58.051542-03	2026-01-17 11:39:26.010023-03	f	\N	f	t	\N	\N	none	1
27497	LACTEOS CASONCREM X480		7791337003354	0.00	0.00	1.000	26	/uploads/7791337003354.jpg	2026-01-12 15:55:58.05706-03	2026-01-17 11:39:26.015734-03	f	\N	f	t	\N	\N	none	1
27502	LACTEOS LECHE  ZERO LACTOSADA X 1LTS		7790742358707	1716.00	2400.00	2.000	26	/uploads/7790742358707.jpg	2026-01-12 15:55:58.072915-03	2026-01-17 11:39:26.029916-03	f	\N	f	t	\N	\N	none	1
27508	LACTEOS QUESO FRESCO PUNTA AGUA X 100GS		CREMOSO PUNTA DE AGUA	7298.50	9500.00	39.622	26	/uploads/CREMOSO PUNTA DE AGUA.jpg	2026-01-12 15:55:58.092601-03	2026-01-17 11:39:26.045929-03	f	\N	f	t	\N	\N	none	1
27514	LATAS PIMIENTOS MORRONES ENTEROS X 210		7791885005053	1527.90	2000.00	2.000	47	/uploads/7791885005053.jpg	2026-01-12 15:55:58.116757-03	2026-01-17 11:39:26.063248-03	f	\N	f	t	\N	\N	none	1
27520	MASCOTAS PIEDRITAS SANITARIAS 9.2 K		7798182780041	0.00	0.00	1.000	28	/uploads/7798182780041.jpg	2026-01-12 15:55:58.137491-03	2026-01-17 11:39:26.082828-03	f	\N	f	t	\N	\N	none	1
27527	PAPEL HIGIENICO  ELEGANTE		7793344904143	1222.10	1650.00	-5.000	31	/uploads/7793344904143.jpg	2026-01-12 15:55:58.164458-03	2026-01-17 11:39:26.104061-03	f	\N	f	t	\N	\N	none	1
27533	PAPEL PAPEL HIGIENOL X30		7790250015215	0.00	0.00	10.000	31	/uploads/7790250015215.jpg	2026-01-12 15:55:58.180356-03	2026-01-17 11:39:26.137547-03	f	\N	f	t	\N	\N	none	1
27538	PEGAMENTOS FASTIX		7790400031010	576.40	775.20	3.000	38	/uploads/7790400031010.jpg	2026-01-12 15:55:58.196298-03	2026-01-17 11:39:26.154169-03	f	\N	f	t	\N	\N	none	1
27543	PERFUMERIA ACODICIONADOR PLUSBELLE		ACONDICIONADOR PLUSBELL	0.00	0.00	0.000	33	/uploads/ACONDICIONADOR PLUSBELL.jpg	2026-01-12 15:55:58.208655-03	2026-01-17 11:39:26.169066-03	f	\N	f	t	\N	\N	none	1
27549	PERFUMERIA APARATO SAPHIRUS		APARATO ECONOMICO	7785.80	11900.00	1.000	33	/uploads/APARATO ECONOMICO.jpg	2026-01-12 15:55:58.223421-03	2026-01-17 11:39:26.18817-03	f	\N	f	t	\N	\N	none	1
27554	UNIDAD PERFUMERIA CURITAS TELA ELASTICA $80 X UNIAD		4005900170996	759.00	1000.00	4.000	33	/uploads/4005900170996.jpg	2026-01-12 15:55:58.236594-03	2026-01-17 11:39:26.208157-03	f	\N	f	t	\N	\N	none	1
27560	PERFUMERIA DESODORANTE REXONA		75068677	220.00	1000.00	3.000	33	/uploads/75068677.jpg	2026-01-12 15:55:58.25254-03	2026-01-17 11:39:26.235591-03	f	\N	f	t	\N	\N	none	1
27565	PERFUMERIA GEL PELO		7791274196447	2090.00	2600.00	2.000	33	/uploads/7791274196447.jpg	2026-01-12 15:55:58.267815-03	2026-01-17 11:39:26.249365-03	f	\N	f	t	\N	\N	none	1
27570	PERFUMERIA JABON TOCADOR ESTRELLA		7790064004580	144.10	216.60	6.000	33	/uploads/7790064004580.jpg	2026-01-12 15:55:58.28075-03	2026-01-17 11:39:26.272019-03	f	\N	f	t	\N	\N	none	1
27575	PERFUMERIA OFF AEROSOL		7790520996329	4346.10	10000.00	2.000	33	/uploads/7790520996329.jpg	2026-01-12 15:55:58.293291-03	2026-01-17 11:39:26.298498-03	f	\N	f	t	\N	\N	none	1
27580	PERFUMERIA PAÑUELITO ELIT X UNIDAD		7790250000358	231.00	400.00	7.000	33	/uploads/7790250000358.jpg	2026-01-12 15:55:58.351414-03	2026-01-17 11:39:26.318314-03	f	\N	f	t	\N	\N	none	1
27585	PERFUMERIA SAPHIRUS AROMATIZAOR TEXTIL		7798184680042	2662.00	4000.00	113.000	33	/uploads/7798184680042.jpg	2026-01-12 15:55:58.36573-03	2026-01-17 11:39:26.337023-03	f	\N	f	t	\N	\N	none	1
27591	PERFUMERIA SHAMPU SEDAL SACHET		7791293025049	213.40	300.00	7.000	33	/uploads/7791293025049.jpg	2026-01-12 15:55:58.380392-03	2026-01-17 11:39:26.364519-03	f	\N	f	t	\N	\N	none	1
27601	PERFUMERIA TOALLITAS PROTECTORE CALIPSO		7790770601165	686.40	1100.00	3.000	33	/uploads/7790770601165.jpg	2026-01-12 15:55:58.420659-03	2026-01-17 11:39:26.400384-03	f	\N	f	t	\N	\N	none	1
27609	ALMACEN MANI FRITO SALADO		7797429007187	5888.30	8000.00	0.310	21	/uploads/7797429007187.jpg	2026-01-12 15:55:58.44844-03	2026-01-17 11:39:26.435593-03	f	\N	f	t	\N	\N	none	1
27617	VERDULERIA BATATAS		VERDURAS BA 592	957.00	1200.00	7.547	27	/uploads/VERDURAS BA 592.jpg	2026-01-12 15:55:58.475355-03	2026-01-17 11:39:26.475868-03	f	\N	f	t	\N	\N	none	1
27622	VERDULERIA CHAUCHAS  X 1/4  $135		VERDULERIA CHA	1100.00	1350.00	3.490	27	/uploads/VERDULERIA CHA.jpg	2026-01-12 15:55:58.492602-03	2026-01-17 11:39:26.503013-03	f	\N	f	t	\N	\N	none	1
27628	VERDULERIA LECHUGA CRESPA		650VERDURASS L	2937.00	3800.00	3.890	27	/uploads/650VERDURASS L.jpg	2026-01-12 15:55:58.507546-03	2026-01-17 11:39:26.534271-03	f	\N	f	t	\N	\N	none	1
27634	VERDULERIA MORRON  VERDE		VERDUU M V	892.10	1150.00	0.559	27	/uploads/VERDUU M V.jpg	2026-01-12 15:55:58.537755-03	2026-01-17 11:39:26.57488-03	f	\N	f	t	\N	\N	none	1
27639	VERDULERIA PELON AMARILLO		VERDURAS PEL	2607.00	3200.00	-5.437	27	/uploads/VERDURAS PEL.jpg	2026-01-12 15:55:58.560974-03	2026-01-17 11:39:26.604982-03	f	\N	f	t	\N	\N	none	1
27646	VERDULERIA REPOLLO BLANCO		VERDURAS.......	44.00	68.40	1.000	27	/uploads/VERDURAS........jpg	2026-01-12 15:55:58.588025-03	2026-01-17 11:39:26.64084-03	f	\N	f	t	\N	\N	none	1
27653	VERDULERIA ZAPALLITO REDONDO		VERDU Z 691	693.00	900.00	3.970	27	/uploads/VERDU Z 691.jpg	2026-01-12 15:55:58.60584-03	2026-01-17 11:39:26.67761-03	f	\N	f	t	\N	\N	none	1
27660	ALMACEN TURRON C/MANI GEORGALOS X80G SEMI BLANDO		7790380012122	660.00	1000.00	1.000	21	/uploads/7790380012122.jpg	2026-01-12 15:55:58.623234-03	2026-01-17 11:39:26.712567-03	f	\N	f	t	\N	\N	none	1
27667	BODEGA CERVEZA PALERMO		7793147001179	343.20	513.00	12.000	37	/uploads/7793147001179.jpg	2026-01-12 15:55:58.639863-03	2026-01-17 11:39:26.74164-03	f	\N	f	t	\N	\N	none	1
27676	ALMACEN ALMENDRAS XKILO X100G		ALMENDRASX100G	19844.00	25000.00	0.080	21	/uploads/ALMENDRASX100G.jpg	2026-01-12 15:55:58.662262-03	2026-01-17 11:39:26.776938-03	f	\N	f	t	\N	\N	none	1
27682	ALMACEN PALMERITAS		PALMERAS123456	0.00	0.00	0.000	21	/uploads/PALMERAS123456.jpg	2026-01-12 15:55:58.682969-03	2026-01-17 11:39:26.789562-03	f	\N	f	t	\N	\N	none	1
27686	BODEGA CERVEZA LATA SALTA RUBIA		7793147572327	260.70	353.40	6.000	37	/uploads/7793147572327.jpg	2026-01-12 15:55:58.697265-03	2026-01-17 11:39:26.801381-03	f	\N	f	t	\N	\N	none	1
27691	GOLOSINAS CHICLE BUBALU X60 U		7622210965035	78.10	100.00	8.000	18	/uploads/7622210965035.jpg	2026-01-12 15:55:58.710371-03	2026-01-17 11:39:26.814817-03	f	\N	f	t	\N	\N	none	1
27697	ART.LIMPIEZA TRAPO DE PISO GAUCHITA		7792459001860	0.00	0.00	0.000	29	/uploads/7792459001860.jpg	2026-01-12 15:55:58.725774-03	2026-01-17 11:39:26.835409-03	f	\N	f	t	\N	\N	none	1
27702	GALLETITAS HOROSCOPO CHOCOLATE		7791672001008	1056.00	1400.00	0.000	25	/uploads/7791672001008.jpg	2026-01-12 15:55:58.74481-03	2026-01-17 11:39:26.848566-03	f	\N	f	t	\N	\N	none	1
27707	PIEZA ART.LIM TRAPO DE PISO CHICO		7790927812925	2399.10	2950.00	0.000	29	/uploads/7790927812925.jpg	2026-01-12 15:55:58.764224-03	2026-01-17 11:39:26.866131-03	f	\N	f	t	\N	\N	none	1
27712	GALLETITAS FAUNA X150G		7790628102714	143.00	250.80	4.000	25	/uploads/7790628102714.jpg	2026-01-12 15:55:58.780688-03	2026-01-17 11:39:26.88957-03	f	\N	f	t	\N	\N	none	1
27717	ALMACEN TOMATE TRITURADO MOLTO X 980G		7798138552814	0.00	0.00	0.000	21	/uploads/7798138552814.jpg	2026-01-12 15:55:58.79736-03	2026-01-17 11:39:26.9029-03	f	\N	f	t	\N	\N	none	1
27722	GOLOSINAS CARAMEO SUGUS X 210.		CARAMELOSSUGUS	26.40	50.00	116.000	18	/uploads/CARAMELOSSUGUS.jpg	2026-01-12 15:55:58.817423-03	2026-01-17 11:39:26.920207-03	f	\N	f	t	\N	\N	none	1
27727	PERFUMERIA POLYANA ROLL ON  BOLILLA		7791905022787	266.20	1100.00	3.000	33	/uploads/7791905022787.jpg	2026-01-12 15:55:58.830776-03	2026-01-17 11:39:26.934231-03	f	\N	f	t	\N	\N	none	1
27733	PERFUMERIA DESODORANTE ODORONO		7791293044224	308.00	1200.00	2.000	33	/uploads/7791293044224.jpg	2026-01-12 15:55:58.854108-03	2026-01-17 11:39:26.954011-03	f	\N	f	t	\N	\N	none	1
27739	GOLOSINAS TURIMAR TRIPLE		77911018	88.00	148.20	6.000	18	/uploads/77911018.jpg	2026-01-12 15:55:58.870963-03	2026-01-17 11:39:26.969639-03	f	\N	f	t	\N	\N	none	1
27744	GOLOSINAS GOMITAS ANILLOS FRUTALES MOGUL X165		ANILLITOSFRUTALES111	58.30	100.00	100.000	18	/uploads/ANILLITOSFRUTALES111.jpg	2026-01-12 15:55:58.883084-03	2026-01-17 11:39:26.982328-03	f	\N	f	t	\N	\N	none	1
27751	GALLETITAS COCO		7791324156797	720.50	1000.00	2.000	25	/uploads/7791324156797.jpg	2026-01-12 15:55:58.900541-03	2026-01-17 11:39:26.997535-03	f	\N	f	t	\N	\N	none	1
27755	ALMACEN PIMIENTA EN GRANO BLANCA , NEGRA		7790150551332	924.00	1150.00	2.000	21	/uploads/7790150551332.jpg	2026-01-12 15:55:58.909907-03	2026-01-17 11:39:27.008744-03	f	\N	f	t	\N	\N	none	1
27761	GOLOSINAS ALFAJOR TOGI		7798397690012	0.00	0.00	10.000	18	/uploads/7798397690012.jpg	2026-01-12 15:55:58.926998-03	2026-01-17 11:39:27.03011-03	f	\N	f	t	\N	\N	none	1
27765	GOLOSINAS CHICLE FIERITA RECARGADO		7798040590164	38.50	50.00	23.000	18	/uploads/7798040590164.jpg	2026-01-12 15:55:58.943669-03	2026-01-17 11:39:27.041394-03	f	\N	f	t	\N	\N	none	1
27771	INSUMO BOLSA CAMIVETA 40/50		7795375579000	605.00	1400.00	3.000	50	/uploads/7795375579000.jpg	2026-01-12 15:55:58.963127-03	2026-01-17 11:39:27.059633-03	f	\N	f	t	\N	\N	none	1
27776	INSUMO BOLSA ARRANQUE 30/40		7794459002540	2200.00	5500.00	1.000	50	/uploads/7794459002540.jpg	2026-01-12 15:55:58.976968-03	2026-01-17 11:39:27.073353-03	f	\N	f	t	\N	\N	none	1
27781	GALLETITAS MARINERAS GYM X350		7798035779130	242.00	330.60	3.000	25	/uploads/7798035779130.jpg	2026-01-12 15:55:58.992317-03	2026-01-17 11:39:27.082842-03	f	\N	f	t	\N	\N	none	1
27787	FARMACIA FABOGESIC  IBU 600		7798032935126	275.00	400.00	2.000	30	/uploads/7798032935126.jpg	2026-01-12 15:55:59.013268-03	2026-01-17 11:39:27.090781-03	f	\N	f	t	\N	\N	none	1
27789	BODEGA QUILMES IPA		7792798013388	0.00	0.00	0.000	36	/uploads/7792798013388.jpg	2026-01-12 15:55:59.06235-03	2026-01-17 11:39:27.097561-03	f	\N	f	t	\N	\N	none	1
27790	ALMACEN FLAN RAVANA DE CHOCOLATE		7790971002426	941.60	1200.00	17.000	21	/uploads/7790971002426.jpg	2026-01-12 15:55:59.065848-03	2026-01-17 11:39:27.100541-03	f	\N	f	t	\N	\N	none	1
27795	ALMACEN PAPAS LE,Q X100		7797429010774	1041.70	1500.00	20.000	21	/uploads/7797429010774.jpg	2026-01-12 15:55:59.078671-03	2026-01-17 11:39:27.12291-03	f	\N	f	t	\N	\N	none	1
27801	ART VARIOS LAMPARA LUZ CALIDA		4958415312705	1019.70	1800.00	9.000	39	/uploads/4958415312705.jpg	2026-01-12 15:55:59.100056-03	2026-01-17 11:39:27.152646-03	f	\N	f	t	\N	\N	none	1
27808	ALMACEN ARROZ MARIA X1		7790387070019	0.00	0.00	0.000	21	/uploads/7790387070019.jpg	2026-01-12 15:55:59.126823-03	2026-01-17 11:39:27.175074-03	f	\N	f	t	\N	\N	none	1
27813	MASCOTAS VAGONETA ADULTO 🐕		MASCOTAAAAA	14062.40	15340.00	15.000	28	/uploads/MASCOTAAAAA.jpg	2026-01-12 15:55:59.144992-03	2026-01-17 11:39:27.194276-03	f	\N	f	t	\N	\N	none	1
27818	GALLETITAS BIZCOCHO 9DE OROAGRIDULCES		7792200000128	770.00	1100.00	6.000	25	/uploads/7792200000128.jpg	2026-01-12 15:55:59.163324-03	2026-01-17 11:39:27.211491-03	f	\N	f	t	\N	\N	none	1
27824	ALMACEN TOSTADAS SIN SAL LEIVA		7790412000295	0.00	0.00	0.000	21	/uploads/7790412000295.jpg	2026-01-12 15:55:59.181746-03	2026-01-17 11:39:27.229417-03	f	\N	f	t	\N	\N	none	1
27829	MASCOTAS VITAL BALANCE 🐱 GATO		MASCOTASGATOOS	3113.00	4500.00	2.600	28	/uploads/MASCOTASGATOOS.jpg	2026-01-12 15:55:59.19953-03	2026-01-17 11:39:27.244861-03	f	\N	f	t	\N	\N	none	1
27835	GOLOSINAS CHOCOARROZ		7790070418289	165.00	205.20	1.000	18	/uploads/7790070418289.jpg	2026-01-12 15:55:59.218107-03	2026-01-17 11:39:27.256015-03	f	\N	f	t	\N	\N	none	1
27839	POLLO CONGELADOS PATITAS DE 🐓  $950 EL ¼		CONGELADOSSSDD	4565.00	6500.00	-0.740	17	/uploads/CONGELADOSSSDD.jpg	2026-01-12 15:55:59.229332-03	2026-01-17 11:39:27.267915-03	f	\N	f	t	\N	\N	none	1
27846	PIEZA ART.LIM PAÑO MEDIA NARANJA X. 3		7790927817142	1887.60	2350.00	4.000	29	/uploads/7790927817142.jpg	2026-01-12 15:55:59.338783-03	2026-01-17 11:39:27.289866-03	f	\N	f	t	\N	\N	none	1
27848	VERDULERIA 🥝 KIWI		VERDURASSSSSS	341.00	433.20	78.000	27	/uploads/VERDURASSSSSS.jpg	2026-01-12 15:55:59.347162-03	2026-01-17 11:39:27.296028-03	f	\N	f	t	\N	\N	none	1
27850	GOLOSINAS CARAMELOS ALKA		7794612011105	7.70	11.40	400.000	18	/uploads/7794612011105.jpg	2026-01-12 15:55:59.356083-03	2026-01-17 11:39:27.301808-03	f	\N	f	t	\N	\N	none	1
27855	ALMACEN CHIA.  X. 100G		CHIASEMILLAS	8261.00	11000.00	0.900	21	/uploads/CHIASEMILLAS.jpg	2026-01-12 15:55:59.375159-03	2026-01-17 11:39:27.318206-03	f	\N	f	t	\N	\N	none	1
28022	ABI CUADERNO CRISTANO		520	1400.00	7087.50	2.000	54	/uploads/520.jpg	2026-01-12 15:55:59.986888-03	2026-01-12 15:55:59.986888-03	f	\N	f	t	\N	\N	none	1
28028	ABI BOLSA RIÑON		6208	47.00	337.50	50.000	54	/uploads/6208.jpg	2026-01-12 15:56:00.047653-03	2026-01-12 15:56:00.047653-03	f	\N	f	t	\N	\N	none	1
28029	ABI BOLSA CARTON		2740	48.00	337.50	50.000	54	/uploads/2740.jpg	2026-01-12 15:56:00.051905-03	2026-01-12 15:56:00.051905-03	f	\N	f	t	\N	\N	none	1
28043	LACTEOS MANTECA REMOLAC		795793102248	0.00	0.00	0.000	26	/uploads/795793102248.jpg	2026-01-12 15:56:00.096458-03	2026-01-12 15:56:00.096458-03	f	\N	f	t	\N	\N	none	1
28118	ABI ABRIDOR COLGANTE MADERA		1633	5284.00	27000.00	1.000	54	/uploads/1633.jpg	2026-01-12 15:56:00.303463-03	2026-01-12 15:56:00.303463-03	f	\N	f	t	\N	\N	none	1
27869	ALMACEN TE MORENITA MEZCLA		7790170926646	388.30	547.20	3.000	21	/uploads/7790170926646.jpg	2026-01-12 15:55:59.429573-03	2026-01-17 11:39:27.352843-03	f	\N	f	t	\N	\N	none	1
27873	ALMACEN ARVEJAS INCA		7790790120257	495.00	750.00	3.000	21	/uploads/7790790120257.jpg	2026-01-12 15:55:59.444861-03	2026-01-17 11:39:27.369636-03	f	\N	f	t	\N	\N	none	1
27879	GOLOSINAS CARAMELO LIPO SUPER ACIDO		7793024000257	61.60	75.00	148.000	18	/uploads/7793024000257.jpg	2026-01-12 15:55:59.470611-03	2026-01-17 11:39:27.39405-03	f	\N	f	t	\N	\N	none	1
27885	GALLETITAS SMAMS TELLENAS COCOLATE		7798181510014	552.20	1200.00	2.000	25	/uploads/7798181510014.jpg	2026-01-12 15:55:59.496499-03	2026-01-17 11:39:27.415151-03	f	\N	f	t	\N	\N	none	1
27891	ALMACEN ACEITE LEGITIMO		7798316700808	2439.80	3200.00	17.000	21	/uploads/7798316700808.jpg	2026-01-12 15:55:59.520546-03	2026-01-17 11:39:27.429354-03	f	\N	f	t	\N	\N	none	1
27897	BEBIDA COCA COLA X250		7790895063855	748.00	1000.00	-8.000	19	/uploads/7790895063855.jpg	2026-01-12 15:55:59.543664-03	2026-01-17 11:39:27.449774-03	f	\N	f	t	\N	\N	none	1
27902	VERDULERIA CEREZA X KILO EL 1/4.  $750		VERDURASSS	2420.00	3385.80	5.000	27	/uploads/VERDURASSS.jpg	2026-01-12 15:55:59.562073-03	2026-01-17 11:39:27.461051-03	f	\N	f	t	\N	\N	none	1
27908	LACTEOS LECHE ARMONIA		7793940305009	1364.00	1700.00	33.000	26	/uploads/7793940305009.jpg	2026-01-12 15:55:59.585446-03	2026-01-17 11:39:27.478735-03	f	\N	f	t	\N	\N	none	1
27910	ART.LIMPIEZA ESPONJA SED METAL XXXCC		7790560001106	624.80	900.00	7.000	29	/uploads/7790560001106.jpg	2026-01-12 15:55:59.592456-03	2026-01-17 11:39:27.484674-03	f	\N	f	t	\N	\N	none	1
27916	ALMACEN QUE RICO TIRABUZON		7794059000151	0.00	0.00	0.000	21	/uploads/7794059000151.jpg	2026-01-12 15:55:59.656703-03	2026-01-17 11:39:27.50428-03	f	\N	f	t	\N	\N	none	1
27921	FARMACIA ACTRON MUJER FORTE		7793640215547	220.00	400.00	4.000	30	/uploads/7793640215547.jpg	2026-01-12 15:55:59.67288-03	2026-01-17 11:39:27.516565-03	f	\N	f	t	\N	\N	none	1
27927	ALMACEN BIZCOCHITOS EL ¼		BIZCOCHOSSSSSS	3300.00	5700.00	-45.675	21	/uploads/BIZCOCHOSSSSSS.jpg	2026-01-12 15:55:59.691134-03	2026-01-17 11:39:27.534885-03	f	\N	f	t	\N	\N	none	1
27934	GALLETITAS CRIOLLITAS X 100G		7790040377707	277.20	300.00	9.000	25	/uploads/7790040377707.jpg	2026-01-12 15:55:59.707757-03	2026-01-17 11:39:27.559689-03	f	\N	f	t	\N	\N	none	1
27939	ALMACEN HARINA  JUAN-A		7798066221387	537.90	730.00	0.000	21	/uploads/7798066221387.jpg	2026-01-12 15:55:59.719251-03	2026-01-17 11:39:27.571248-03	f	\N	f	t	\N	\N	none	1
27947	ART.LIMPIEZA DENTRIFICO ODOL X70		7509546692265	1687.40	2200.00	12.000	33	/uploads/7509546692265.jpg	2026-01-12 15:55:59.740965-03	2026-01-17 11:39:27.595409-03	f	\N	f	t	\N	\N	none	1
27962	GOLOSINAS BON O BON		7790040614000	652.30	850.00	4.000	18	/uploads/7790040614000.jpg	2026-01-12 15:55:59.788439-03	2026-01-17 11:39:27.656261-03	f	\N	f	t	\N	\N	none	1
27966	UNIDAD BASTA MOSQUITO		000058000137	8800.00	9000.00	-4.000	52	/uploads/000058000137.jpg	2026-01-12 15:55:59.801051-03	2026-01-17 11:39:27.675605-03	f	\N	f	t	\N	\N	none	1
27967	FARMACIA OMEPAZOL 20 MILG		0003	62.70	150.00	-8.000	30	/uploads/0003.jpg	2026-01-12 15:55:59.803208-03	2026-01-17 11:39:27.679477-03	f	\N	f	t	\N	\N	none	1
27969	ART VARIOS VELAS DE CUMPLEAÑOS TODAS		7798137923158	275.00	500.00	55.000	39	/uploads/7798137923158.jpg	2026-01-12 15:55:59.808024-03	2026-01-17 11:39:27.687281-03	f	\N	f	t	\N	\N	none	1
27975	BODEGA TRES PLUMAS LICORES		TRESPLUMASS	2651.00	3800.00	3.000	37	/uploads/TRESPLUMASS.jpg	2026-01-12 15:55:59.830973-03	2026-01-17 11:39:27.712506-03	f	\N	f	t	\N	\N	none	1
27980	GOLOSINAS CAPITAN CHOCOLATE		7798039910027WWE	1048.30	1350.00	14.000	18	/uploads/7798039910027WWE.jpg	2026-01-12 15:55:59.848703-03	2026-01-17 11:39:27.732444-03	f	\N	f	t	\N	\N	none	1
27990	ALMACEN ALFAJOR HAMLET		7790040144132	194.70	280.00	6.000	21	/uploads/7790040144132.jpg	2026-01-12 15:55:59.881821-03	2026-01-17 11:39:27.77288-03	f	\N	f	t	\N	\N	none	1
27995	ALMACEN ROSQUITA BAÑADA		7792684000447	800.80	980.00	0.000	21	/uploads/7792684000447.jpg	2026-01-12 15:55:59.895955-03	2026-01-17 11:39:27.785812-03	f	\N	f	t	\N	\N	none	1
28001	FARMACIA ASPIRINETA UN		ASPIRINETASSSSSSS	48.40	100.00	15.000	30	/uploads/ASPIRINETASSSSSSS.jpg	2026-01-12 15:55:59.911503-03	2026-01-17 11:39:27.802559-03	f	\N	f	t	\N	\N	none	1
28005	GOLOSINAS CHICLE GUMBALS X18 U		CHICLEGUMBALLSSSSSD	573.10	750.00	9.000	18	/uploads/CHICLEGUMBALLSSSSSD.jpg	2026-01-12 15:55:59.923859-03	2026-01-17 11:39:27.813637-03	f	\N	f	t	\N	\N	none	1
28017	ABI KIT ESCRITORIO		490	1689.60	2500.00	1.000	54	/uploads/490.jpg	2026-01-12 15:55:59.970223-03	2026-01-17 11:39:27.849256-03	f	\N	f	t	\N	\N	none	1
28032	MEDIAS ELEMENTO TALLE 4		4657	2200.00	2800.00	4.000	55	/uploads/4657.jpg	2026-01-12 15:56:00.062675-03	2026-01-17 11:39:27.863957-03	f	\N	f	t	\N	\N	none	1
28038	MEDIAS ZOQUETES GRIS X 3		45637	1650.00	2000.00	3.000	55	/uploads/45637.jpg	2026-01-12 15:56:00.077759-03	2026-01-17 11:39:27.893806-03	f	\N	f	t	\N	\N	none	1
28047	UNIDAD SANDWICH DE MIGA		000000000	5280.00	6500.00	-19.000	52	/uploads/000000000.jpg	2026-01-12 15:56:00.106378-03	2026-01-17 11:39:27.917029-03	f	\N	f	t	\N	\N	none	1
28053	BIJOUTERI ARITO NEGROS CON PIEDRITAS BRILLITO		1076	1210.00	2200.00	3.000	56	/uploads/1076.jpg	2026-01-12 15:56:00.12293-03	2026-01-17 11:39:27.932202-03	f	\N	f	t	\N	\N	none	1
28061	BIJOUTERI PULSERA CORAZON CON DIMANTE		1026	4400.00	7000.00	1.000	56	/uploads/1026.jpg	2026-01-12 15:56:00.142504-03	2026-01-17 11:39:27.954948-03	f	\N	f	t	\N	\N	none	1
28066	BIJOUTERI ARITO PIEDRITA DIAMANTE  X PAR		1022	220.00	400.00	31.000	56	/uploads/1022.jpg	2026-01-12 15:56:00.154111-03	2026-01-17 11:39:27.970036-03	f	\N	f	t	\N	\N	none	1
28073	BIJOUTERI CADENITAS MUJER		085	1650.00	3000.00	2.000	56	/uploads/085.jpg	2026-01-12 15:56:00.172951-03	2026-01-17 11:39:27.990122-03	f	\N	f	t	\N	\N	none	1
28078	BIJOUTERI DIJES ESTRELLITAS X UNIDAD		004	495.00	900.00	1.000	56	/uploads/004.jpg	2026-01-12 15:56:00.186483-03	2026-01-17 11:39:28.003186-03	f	\N	f	t	\N	\N	none	1
28087	BIJOUTERI ANILLO LOVE		020	550.00	1100.00	1.000	56	/uploads/020.jpg	2026-01-12 15:56:00.219189-03	2026-01-17 11:39:28.026309-03	f	\N	f	t	\N	\N	none	1
28091	BIJOUTERI ANILLO PIEDRITAS		00016	1100.00	2000.00	4.000	56	/uploads/00016.jpg	2026-01-12 15:56:00.229055-03	2026-01-17 11:39:28.036508-03	f	\N	f	t	\N	\N	none	1
28096	BIJOUTERI BROCHAS		1479	1760.00	2900.00	2.000	56	/uploads/1479.jpg	2026-01-12 15:56:00.243575-03	2026-01-17 11:39:28.050485-03	f	\N	f	t	\N	\N	none	1
28101	GOLOSINAS MENTHO PLUS		7790580110901	361.90	900.00	-17.000	18	/uploads/7790580110901.jpg	2026-01-12 15:56:00.255098-03	2026-01-17 11:39:28.063008-03	f	\N	f	t	\N	\N	none	1
28107	ABI CUADERNOS TAPA DURA A5		53427	5699.10	7800.00	1.000	54	/uploads/53427.jpg	2026-01-12 15:56:00.270184-03	2026-01-17 11:39:28.07678-03	f	\N	f	t	\N	\N	none	1
28114	ABI MATE DIJE		6827	2428.80	3300.00	1.000	54	/uploads/6827.jpg	2026-01-12 15:56:00.28858-03	2026-01-17 11:39:28.103911-03	f	\N	f	t	\N	\N	none	1
28124	GALLETITAS OBLEAS COFLER		COFLERRRR	0.00	0.00	0.000	25	/uploads/COFLERRRR.jpg	2026-01-12 15:56:00.362978-03	2026-01-17 11:39:28.128173-03	f	\N	f	t	\N	\N	none	1
28129	VERDULERIA APIOO		APIOOOO	1100.00	2500.00	-0.589	27	/uploads/APIOOOO.jpg	2026-01-12 15:56:00.378424-03	2026-01-17 11:39:28.15258-03	f	\N	f	t	\N	\N	none	1
28134	UNIDAD ROSQUITA		ROSQUITA	187.00	250.00	25.000	52	/uploads/ROSQUITA.jpg	2026-01-12 15:56:00.395338-03	2026-01-17 11:39:28.173606-03	f	\N	f	t	\N	\N	none	1
28145	ART VARIOS PARACETAMOL 500		PARACETAMOLLL	49.50	200.00	13.000	39	/uploads/PARACETAMOLLL.jpg	2026-01-12 15:56:00.42881-03	2026-01-17 11:39:28.217662-03	f	\N	f	t	\N	\N	none	1
28351	ALMACEN GELATINA EMET		GELATINAAAAAS	635.00	2700.00	6.000	21	/uploads/GELATINAAAAAS.jpg	2026-01-12 15:56:01.120764-03	2026-01-12 15:56:01.120764-03	f	\N	f	t	\N	\N	none	1
28367	CHOCOLATES BON  O BON		BONOBONNNNNNN	3550.00	13162.50	2.000	32	/uploads/BONOBONNNNNNN.jpg	2026-01-12 15:56:01.156514-03	2026-01-12 15:56:01.156514-03	f	\N	f	t	\N	\N	none	1
28158	ALMACEN SOL PAMPEANO LASAGNA		155419	938.30	1160.00	0.000	21	/uploads/155419.jpg	2026-01-12 15:56:00.485822-03	2026-01-17 11:39:28.252863-03	f	\N	f	t	\N	\N	none	1
28164	JUGUETES STEFFI LOVE		JUGUETES001	16500.00	28000.00	1.000	58	/uploads/JUGUETES001.jpg	2026-01-12 15:56:00.500071-03	2026-01-17 11:39:28.268172-03	f	\N	f	t	\N	\N	none	1
28168	JUGUETES ZOE PRICESA		JUGUETES005	8800.00	15000.00	0.000	58	/uploads/JUGUETES005.jpg	2026-01-12 15:56:00.510214-03	2026-01-17 11:39:28.280927-03	f	\N	f	t	\N	\N	none	1
28173	JUGUETES ANLILI		JUGUETES010	8250.00	15000.00	-2.000	58	/uploads/JUGUETES010.jpg	2026-01-12 15:56:00.523289-03	2026-01-17 11:39:28.294239-03	f	\N	f	t	\N	\N	none	1
28178	JUGUETES BEAUTY ,		JUGUETES015	1870.00	3000.00	0.000	58	/uploads/JUGUETES015.jpg	2026-01-12 15:56:00.539211-03	2026-01-17 11:39:28.310336-03	f	\N	f	t	\N	\N	none	1
28183	JUGUETES DINOSAURIO LUCES		JUGUETES020	9350.00	16000.00	0.000	58	/uploads/JUGUETES020.jpg	2026-01-12 15:56:00.556721-03	2026-01-17 11:39:28.323186-03	f	\N	f	t	\N	\N	none	1
28188	JUGUETES JUEGO DE DAMAS GRANDE		JUGUETES026	3630.00	7000.00	0.000	58	/uploads/JUGUETES026.jpg	2026-01-12 15:56:00.577178-03	2026-01-17 11:39:28.340228-03	f	\N	f	t	\N	\N	none	1
28193	JUGUETES JUEGO DE DAMAS CHICO		JUGUETES031	2530.00	4500.00	1.000	58	/uploads/JUGUETES031.jpg	2026-01-12 15:56:00.592747-03	2026-01-17 11:39:28.353479-03	f	\N	f	t	\N	\N	none	1
28198	LIBRERIA VOLIGOMA		VOLIGOMAAAA	1320.00	1700.00	3.000	59	/uploads/VOLIGOMAAAA.jpg	2026-01-12 15:56:00.604978-03	2026-01-17 11:39:28.372243-03	f	\N	f	t	\N	\N	none	1
28204	ART VARIOS PAPELILLO OCB		PAPELILLOOOO	921.80	1200.00	5.000	39	/uploads/PAPELILLOOOO.jpg	2026-01-12 15:56:00.619693-03	2026-01-17 11:39:28.397528-03	f	\N	f	t	\N	\N	none	1
28209	JUGUETES CUBO MAGICO  BOLSITA		JUGUETES037	660.00	900.00	5.000	58	/uploads/JUGUETES037.jpg	2026-01-12 15:56:00.63142-03	2026-01-17 11:39:28.419493-03	f	\N	f	t	\N	\N	none	1
28213	JUGUETES ¿LOS VES?		JUGUETES041	2420.00	4500.00	1.000	58	/uploads/JUGUETES041.jpg	2026-01-12 15:56:00.646474-03	2026-01-17 11:39:28.429324-03	f	\N	f	t	\N	\N	none	1
28217	JUGUETES TRUCO Y GENERALA		JUGUETES045	4290.00	8000.00	1.000	58	/uploads/JUGUETES045.jpg	2026-01-12 15:56:00.660346-03	2026-01-17 11:39:28.440557-03	f	\N	f	t	\N	\N	none	1
28222	JUGUETES MUÑECA CON CARRITO		JUGUETES058	17600.00	28000.00	0.000	58	/uploads/JUGUETES058.jpg	2026-01-12 15:56:00.678235-03	2026-01-17 11:39:28.463136-03	f	\N	f	t	\N	\N	none	1
28227	JUGUETES ESLIME MUÑECO		JUGUETES053	1320.00	2000.00	-1.000	58	/uploads/JUGUETES053.jpg	2026-01-12 15:56:00.694065-03	2026-01-17 11:39:28.494312-03	f	\N	f	t	\N	\N	none	1
28232	JUGUETES PINTURA ZAPATO		JUGUETES060	7150.00	10000.00	0.000	58	/uploads/JUGUETES060.jpg	2026-01-12 15:56:00.713289-03	2026-01-17 11:39:28.518108-03	f	\N	f	t	\N	\N	none	1
28237	JUGUETES CAMION BOMBERO		JUGUETES064	2750.00	4000.00	0.000	58	/uploads/JUGUETES064.jpg	2026-01-12 15:56:00.724691-03	2026-01-17 11:39:28.541216-03	f	\N	f	t	\N	\N	none	1
28243	CIGARRILLOS RED POINT		REDPOINTTT	1831.50	2300.00	49.000	51	/uploads/REDPOINTTT.jpg	2026-01-12 15:56:00.740174-03	2026-01-17 11:39:28.560443-03	f	\N	f	t	\N	\N	none	1
28248	PERFUMERIA DERMAGLOS SOLAR		PERFUMERIA073	13200.00	18000.00	1.000	33	/uploads/PERFUMERIA073.jpg	2026-01-12 15:56:00.75246-03	2026-01-17 11:39:28.570273-03	f	\N	f	t	\N	\N	none	1
28253	LIBRERIA TEMPERA. 10 COLORES X UNIDAD		TEMPERAAAAS	161.70	200.00	-14.000	59	/uploads/TEMPERAAAAS.jpg	2026-01-12 15:56:00.807993-03	2026-01-17 11:39:28.586374-03	f	\N	f	t	\N	\N	none	1
28265	CIGARRILLOS CHESTERFIELD BOX X 10		CIGARRILLOSCHESTBOX	2794.00	3050.00	18.000	51	/uploads/CIGARRILLOSCHESTBOX.jpg	2026-01-12 15:56:00.848596-03	2026-01-17 11:39:28.631112-03	f	\N	f	t	\N	\N	none	1
28271	ART.LIMPIEZA PAPEL OFERTA		PAPELOFERTASAS	149.60	300.00	292.000	29	/uploads/PAPELOFERTASAS.jpg	2026-01-12 15:56:00.867694-03	2026-01-17 11:39:28.658085-03	f	\N	f	t	\N	\N	none	1
28272	CIGARRILLOS CHESTERFIELD DE UVA DE 20		CIGARILLOSSSSSSSS	4631.00	4900.00	10.000	51	/uploads/CIGARILLOSSSSSSSS.jpg	2026-01-12 15:56:00.870409-03	2026-01-17 11:39:28.662855-03	f	\N	f	t	\N	\N	none	1
28277	PERFUMERIA CREME DE BARBEAR		COD082	4400.00	5040.00	1.000	33	/uploads/COD082.jpg	2026-01-12 15:56:00.88687-03	2026-01-17 11:39:28.680541-03	f	\N	f	t	\N	\N	none	1
28283	PERFUMERIA ALCOHOL EN GEL X 250GS		COD088	3850.00	4500.00	1.000	33	/uploads/COD088.jpg	2026-01-12 15:56:00.905964-03	2026-01-17 11:39:28.697092-03	f	\N	f	t	\N	\N	none	1
28288	ALMACEN PAN RALLADO MAMA COVONA AJO Y PEREJIL		MAMACOCINAAAA	1254.00	1600.00	10.000	21	/uploads/MAMACOCINAAAA.jpg	2026-01-12 15:56:00.921598-03	2026-01-17 11:39:28.707834-03	f	\N	f	t	\N	\N	none	1
28294	PERFUMERIA CREMA NIVEA POTE		NIVEAAAAAA	3162.50	3500.00	1.000	33	/uploads/NIVEAAAAAA.jpg	2026-01-12 15:56:00.942818-03	2026-01-17 11:39:28.719646-03	f	\N	f	t	\N	\N	none	1
28300	NATURA PERFUME KAIAK		0001	44000.00	47200.00	1.000	61	/uploads/0001.jpg	2026-01-12 15:56:00.96073-03	2026-01-17 11:39:28.733807-03	f	\N	f	t	\N	\N	none	1
28304	CIGARRILLOS RED POIN BOX DE 20		CIGARILLOSSSSSSS	1732.50	2300.00	-9.000	51	/uploads/CIGARILLOSSSSSSS.jpg	2026-01-12 15:56:00.970685-03	2026-01-17 11:39:28.741107-03	f	\N	f	t	\N	\N	none	1
28311	JUGUETES CAMINCITOS BLISTER X4		JUGUETES076	2420.00	3900.00	3.000	58	/uploads/JUGUETES076.jpg	2026-01-12 15:56:00.987344-03	2026-01-17 11:39:28.755034-03	f	\N	f	t	\N	\N	none	1
28316	PERFUMERIA PRESTO BARBA MUJER		PRESTOBARBAAAAA	1320.00	1750.00	7.000	33	/uploads/PRESTOBARBAAAAA.jpg	2026-01-12 15:56:01.008089-03	2026-01-17 11:39:28.766372-03	f	\N	f	t	\N	\N	none	1
28322	JUGUETES TINY SET DE UÑAS		JUGUETES087	2420.00	4000.00	1.000	58	/uploads/JUGUETES087.jpg	2026-01-12 15:56:01.028121-03	2026-01-17 11:39:28.78376-03	f	\N	f	t	\N	\N	none	1
28327	JUGUETES SOPHIE SET PULSERA		JUGUETE085	4620.00	6000.00	1.000	58	/uploads/JUGUETE085.jpg	2026-01-12 15:56:01.044994-03	2026-01-17 11:39:28.798286-03	f	\N	f	t	\N	\N	none	1
28330	ACCESORIOS CELULARES AURICULAR SAMSUNG AKG		CEL005	1980.00	3600.00	1.000	62	/uploads/CEL005.jpg	2026-01-12 15:56:01.05434-03	2026-01-17 11:39:28.805092-03	f	\N	f	t	\N	\N	none	1
28331	ACCESORIOS CELULARES CABLE CARGA RAPIDA  TIPO C Y MINI		CEL009	1430.00	2600.00	4.000	62	/uploads/CEL009.jpg	2026-01-12 15:56:01.060287-03	2026-01-17 11:39:28.807333-03	f	\N	f	t	\N	\N	none	1
28339	CIGARRILLOS PHILIPMORRIS DE 10 28%		CIGARILLOSSSSSSSSSS	3168.00	3600.00	0.000	51	/uploads/CIGARILLOSSSSSSSSSS.jpg	2026-01-12 15:56:01.09142-03	2026-01-17 11:39:28.825873-03	f	\N	f	t	\N	\N	none	1
28344	ART VARIOS GOMITAS PARA EL PELO		GOMITASSSSSS	183.70	500.00	-39.000	39	/uploads/GOMITASSSSSS.jpg	2026-01-12 15:56:01.102501-03	2026-01-17 11:39:28.856949-03	f	\N	f	t	\N	\N	none	1
28355	JUGUETES PARLANTE CON MICROFONO		PARLANTEEEEEE	14300.00	20000.00	-2.000	58	/uploads/PARLANTEEEEEE.jpg	2026-01-12 15:56:01.12932-03	2026-01-17 11:39:28.8989-03	f	\N	f	t	\N	\N	none	1
28361	BAZAR JARRA STANLEY		JARRAAAAAAAAA	18700.00	29000.00	3.000	63	/uploads/JARRAAAAAAAAA.jpg	2026-01-12 15:56:01.142642-03	2026-01-17 11:39:28.915677-03	f	\N	f	t	\N	\N	none	1
28374	ART VARIOS CUADERNOS MAGIA		CUADERNOSSSSS	6600.00	8000.00	6.000	39	/uploads/CUADERNOSSSSS.jpg	2026-01-12 15:56:01.172627-03	2026-01-17 11:39:28.942856-03	f	\N	f	t	\N	\N	none	1
28379	BODEGA ANDES LATON  710		LATONNNNNNN	2735.70	3400.00	9.000	37	/uploads/LATONNNNNNN.jpg	2026-01-12 15:56:01.185051-03	2026-01-17 11:39:28.958481-03	f	\N	f	t	\N	\N	none	1
28387	GOLOSINAS BLUPER X155		BLUPERRRRR	61.60	100.00	-341.000	18	/uploads/BLUPERRRRR.jpg	2026-01-12 15:56:01.213188-03	2026-01-17 11:39:28.979859-03	f	\N	f	t	\N	\N	none	1
28389	BODEGA LIT ROJA ALE		CERBEZAAAA	1045.00	1500.00	12.000	37	/uploads/CERBEZAAAA.jpg	2026-01-12 15:56:01.221286-03	2026-01-17 11:39:28.984141-03	f	\N	f	t	\N	\N	none	1
28393	LIBRERIA REGLAS,ESCUADRA,TRANSPORTADOR		REGLASSSSS	1100.00	1500.00	2.000	59	/uploads/REGLASSSSS.jpg	2026-01-12 15:56:01.230494-03	2026-01-17 11:39:28.994101-03	f	\N	f	t	\N	\N	none	1
28399	LIBRERIA EZCOO CON GOMA		VIROMEEEEEEE	825.00	1200.00	2.000	59	/uploads/VIROMEEEEEEE.jpg	2026-01-12 15:56:01.245337-03	2026-01-17 11:39:29.00785-03	f	\N	f	t	\N	\N	none	1
28404	LIBRERIA FABER CASTELL BIROME		BIROMEEEEE	330.00	500.00	1.000	59	/uploads/BIROMEEEEE.jpg	2026-01-12 15:56:01.255764-03	2026-01-17 11:39:29.019778-03	f	\N	f	t	\N	\N	none	1
28410	LIBRERIA COLORES EZCO		COLORESSD	825.00	1200.00	-2.000	59	/uploads/COLORESSD.jpg	2026-01-12 15:56:01.269344-03	2026-01-17 11:39:29.034555-03	f	\N	f	t	\N	\N	none	1
28414	LIBRERIA HOJA CANZON CAPITOLIO N°3 DE COLORES		HOJASSSS	605.00	800.00	1.000	59	/uploads/HOJASSSS.jpg	2026-01-12 15:56:01.278207-03	2026-01-17 11:39:29.043344-03	f	\N	f	t	\N	\N	none	1
28419	LIBRERIA HOJAS DE CARPETA CAPITOLIO N3 CUADRICULADAS Y RAYA		HOJASSSSS	2530.00	3800.00	-2.000	59	/uploads/HOJASSSSS.jpg	2026-01-12 15:56:01.293456-03	2026-01-17 11:39:29.055442-03	f	\N	f	t	\N	\N	none	1
28427	LIBRERIA EL NENE BLOCK N°5 BLANCO		ELNENEEEEEE	2640.00	3200.00	0.000	59	/uploads/ELNENEEEEEE.jpg	2026-01-12 15:56:01.322651-03	2026-01-17 11:39:29.079838-03	f	\N	f	t	\N	\N	none	1
28434	LIBRERIA CARTUCHERA TUBO CHICO		CARTUCHERAAA	1980.00	3000.00	9.000	59	/uploads/CARTUCHERAAA.jpg	2026-01-12 15:56:01.345965-03	2026-01-17 11:39:29.098728-03	f	\N	f	t	\N	\N	none	1
28439	LIBRERIA RESALTADORES		RESALTADORESSSS	341.00	800.00	93.000	59	/uploads/RESALTADORESSSS.jpg	2026-01-12 15:56:01.364748-03	2026-01-17 11:39:29.113585-03	f	\N	f	t	\N	\N	none	1
28444	LIBRERIA PROTECTOR ADHESIVO CONTACT		CONTACC	0.00	0.00	10.000	59	/uploads/CONTACC.jpg	2026-01-12 15:56:01.380139-03	2026-01-17 11:39:29.132619-03	f	\N	f	t	\N	\N	none	1
28447	ART VARIOS COLITAS		COLITASSSSSS	935.00	1500.00	-1.000	39	/uploads/COLITASSSSSS.jpg	2026-01-12 15:56:01.388237-03	2026-01-17 11:39:29.145987-03	f	\N	f	t	\N	\N	none	1
28449	CIGARRILLOS PHILIPMORRIS		PHILIPSSSSS	5291.00	5500.00	10.000	51	/uploads/PHILIPSSSSS.jpg	2026-01-12 15:56:01.392571-03	2026-01-17 11:39:29.154706-03	f	\N	f	t	\N	\N	none	1
28456	LIBRERIA CINTA SCOCH CHICA		CINTITA	330.00	500.00	-3.000	59	/uploads/CINTITA.jpg	2026-01-12 15:56:01.447679-03	2026-01-17 11:39:29.183234-03	f	\N	f	t	\N	\N	none	1
28462	LIBRERIA EZCO BOLIGRAFOS		LAPICERASS	1870.00	2500.00	4.000	59	/uploads/LAPICERASS.jpg	2026-01-12 15:56:01.463598-03	2026-01-17 11:39:29.199021-03	f	\N	f	t	\N	\N	none	1
28468	LIBRERIA CONTA SCOCH		CINTAAA	1870.00	2500.00	3.000	59	/uploads/CINTAAA.jpg	2026-01-12 15:56:01.478565-03	2026-01-17 11:39:29.216865-03	f	\N	f	t	\N	\N	none	1
28474	LIBRERIA REGLAS FLEXIBLES		REGLAAS	550.00	800.00	4.000	59	/uploads/REGLAAS.jpg	2026-01-12 15:56:01.494573-03	2026-01-17 11:39:29.232428-03	f	\N	f	t	\N	\N	none	1
28480	ALMACEN PASTELITO		PASTELITOOOOOOO	550.00	650.00	11.000	21	/uploads/PASTELITOOOOOOO.jpg	2026-01-12 15:56:01.513248-03	2026-01-17 11:39:29.247275-03	f	\N	f	t	\N	\N	none	1
28485	PERFUMERIA KAIAK AVENTURA		PERFUMEEEEEE	40480.00	40800.00	0.000	33	/uploads/PERFUMEEEEEE.jpg	2026-01-12 15:56:01.530525-03	2026-01-17 11:39:29.260557-03	f	\N	f	t	\N	\N	none	1
28490	JUGUETES LLAVEROS MARADONA		LLAVEROSSSSS	1540.00	2500.00	2.000	58	/uploads/LLAVEROSSSSS.jpg	2026-01-12 15:56:01.546478-03	2026-01-17 11:39:29.272523-03	f	\N	f	t	\N	\N	none	1
28496	BAZAR BOTELLA SPORT DE 600ML		BOTELLA SPORT	12100.00	17000.00	1.000	63	/uploads/BOTELLA SPORT.jpg	2026-01-12 15:56:01.569077-03	2026-01-17 11:39:29.288949-03	f	\N	f	t	\N	\N	none	1
28502	ALMACEN PROVENZAL 25G		PROVENZALLLLLL	1016.40	1400.00	4.000	21	/uploads/PROVENZALLLLLL.jpg	2026-01-12 15:56:01.594947-03	2026-01-17 11:39:29.303082-03	f	\N	f	t	\N	\N	none	1
28507	GOLOSINAS CARAMELO BLANDO FRUTILLA		FRUTILLAAAAAAA	220.00	400.00	67.000	18	/uploads/FRUTILLAAAAAAA.jpg	2026-01-12 15:56:01.614592-03	2026-01-17 11:39:29.318237-03	f	\N	f	t	\N	\N	none	1
28698	ART VARIOS APARATO FUYI		APARATOOOO	1980.00	3000.00	1.000	39	APARATOOOO.jpg	2026-01-17 11:39:29.864166-03	2026-01-17 11:39:29.864166-03	f	\N	f	t	\N	\N	none	1
28699	GOLOSINAS ALFAJOR ORENSE		7798196060344	752.40	1000.00	0.000	18	7798196060344.jpg	2026-01-17 11:39:29.866407-03	2026-01-17 11:39:29.866407-03	f	\N	f	t	\N	\N	none	1
28700	ALMACEN POCHOCLO POP CORN		7797429040900	676.50	900.00	-1.000	21	7797429040900.jpg	2026-01-17 11:39:29.869083-03	2026-01-17 11:39:29.869083-03	f	\N	f	t	\N	\N	none	1
28701	ALMACEN PUREZA INTEGRAL LEUDANTE HARINA		7792180136671	1558.70	2000.00	5.000	21	7792180136671.jpg	2026-01-17 11:39:29.873641-03	2026-01-17 11:39:29.873641-03	f	\N	f	t	\N	\N	none	1
28702	ART VARIOS BARRA DE CILICONA GRANDE		7798252489614	330.00	600.00	31.000	39	7798252489614.jpg	2026-01-17 11:39:29.878261-03	2026-01-17 11:39:29.878261-03	f	\N	f	t	\N	\N	none	1
28703	ALMACEN AJI EN VINAGRES		AJIENVINAGRESSS	9460.00	15000.00	1.600	21	AJIENVINAGRESSS.jpg	2026-01-17 11:39:29.88285-03	2026-01-17 11:39:29.88285-03	f	\N	f	t	\N	\N	none	1
28704	UNIDAD DURAZNO		DURAZNO	3080.00	5300.00	-5.160	52	DURAZNO.jpg	2026-01-17 11:39:29.889419-03	2026-01-17 11:39:29.889419-03	f	\N	f	t	\N	\N	none	1
28705	ALMACEN PASEO TOSTADAS		TOSTADASPASEOO	1105.50	1400.00	1.000	21	TOSTADASPASEOO.jpg	2026-01-17 11:39:29.893953-03	2026-01-17 11:39:29.893953-03	f	\N	f	t	\N	\N	none	1
28706	CIGARRILLOS LUCKY ORIGEN		CIGARRILLOS	2761.00	3000.00	9.000	51	CIGARRILLOS.jpg	2026-01-17 11:39:29.898398-03	2026-01-17 11:39:29.898398-03	f	\N	f	t	\N	\N	none	1
28707	ART VARIOS ENCENDEDOR MAXI BIC		070330631335	1141.80	1500.00	2.000	39	070330631335.jpg	2026-01-17 11:39:29.902887-03	2026-01-17 11:39:29.902887-03	f	\N	f	t	\N	\N	none	1
28708	ART VARIOS MINI BIC ENCENDEDOR		ENCENDEDORRRR	907.50	1200.00	4.000	39	ENCENDEDORRRR.jpg	2026-01-17 11:39:29.907621-03	2026-01-17 11:39:29.907621-03	f	\N	f	t	\N	\N	none	1
28709	UNIDAD LUCES DE NAVIDAD		LUCES	1650.00	3000.00	0.000	52	LUCES.jpg	2026-01-17 11:39:29.911432-03	2026-01-17 11:39:29.911432-03	f	\N	f	t	\N	\N	none	1
28710	ALMACEN ACEITUNAS NEGRAS		7798155561905	11187.00	15000.00	0.780	21	7798155561905.jpg	2026-01-17 11:39:29.913666-03	2026-01-17 11:39:29.913666-03	f	\N	f	t	\N	\N	none	1
28711	ALMACEN SEMILLA DE QUINOA		QUINOAAAAAA	8118.00	11000.00	1.000	21	QUINOAAAAAA.jpg	2026-01-17 11:39:29.916074-03	2026-01-17 11:39:29.916074-03	f	\N	f	t	\N	\N	none	1
28712	ALMACEN ESCARBADIENTES		6975874755568	321.20	1000.00	21.000	21	6975874755568.jpg	2026-01-17 11:39:29.918334-03	2026-01-17 11:39:29.918334-03	f	\N	f	t	\N	\N	none	1
28713	ALMACEN FIANBRIN		FIAMBRINNNNN	12100.00	17000.00	1.660	21	FIAMBRINNNNN.jpg	2026-01-17 11:39:29.920899-03	2026-01-17 11:39:29.920899-03	f	\N	f	t	\N	\N	none	1
28714	ALMACEN CAÑUELA FRITOLIN		FRITOLINNNNN	3565.10	4400.00	2.000	21	FRITOLINNNNN.jpg	2026-01-17 11:39:29.92322-03	2026-01-17 11:39:29.92322-03	f	\N	f	t	\N	\N	none	1
28715	ALMACEN COCINERO FRITOLIN		FRITOLINNNNNN	3357.20	4200.00	1.000	21	FRITOLINNNNNN.jpg	2026-01-17 11:39:29.925518-03	2026-01-17 11:39:29.925518-03	f	\N	f	t	\N	\N	none	1
28716	ALMACEN SALSA CARAMELO		CARAMELOOOOO	1798.50	2200.00	2.000	21	CARAMELOOOOO.jpg	2026-01-17 11:39:29.92777-03	2026-01-17 11:39:29.92777-03	f	\N	f	t	\N	\N	none	1
28717	ALMACEN SALSA FRUTILLA THAITI		FRUTILLAAAA	2187.90	2700.00	2.000	21	FRUTILLAAAA.jpg	2026-01-17 11:39:29.929812-03	2026-01-17 11:39:29.929812-03	f	\N	f	t	\N	\N	none	1
28718	ALMACEN SALSA TAHITIN ACETO BALSAMICO		ACETOOOOO	2187.90	2700.00	2.000	21	ACETOOOOO.jpg	2026-01-17 11:39:29.931841-03	2026-01-17 11:39:29.931841-03	f	\N	f	t	\N	\N	none	1
28719	ALMACEN SALSA CHOCOLATE TAHITI		CHOCOLATEEEEE	2940.30	3600.00	2.000	21	CHOCOLATEEEEE.jpg	2026-01-17 11:39:29.93389-03	2026-01-17 11:39:29.93389-03	f	\N	f	t	\N	\N	none	1
28720	ALMACEN CHIMICHURRI TAHITI		CHIMICHURRIIIII	1579.60	1950.00	2.000	21	CHIMICHURRIIIII.jpg	2026-01-17 11:39:29.936817-03	2026-01-17 11:39:29.936817-03	f	\N	f	t	\N	\N	none	1
28721	ALMACEN NACHOS RISKI ORIGINAL		NACHOSSSS	2282.50	2900.00	4.000	21	NACHOSSSS.jpg	2026-01-17 11:39:29.939271-03	2026-01-17 11:39:29.939271-03	f	\N	f	t	\N	\N	none	1
28722	ALMACEN TURRON GEORGALOS		7790380011903	1640.10	2000.00	2.000	21	7790380011903.jpg	2026-01-17 11:39:29.942206-03	2026-01-17 11:39:29.942206-03	f	\N	f	t	\N	\N	none	1
28723	ALMACEN YOGURT LA SERENISIMA		7791337007451	1304.60	1600.00	5.000	21	7791337007451.jpg	2026-01-17 11:39:29.945357-03	2026-01-17 11:39:29.945357-03	f	\N	f	t	\N	\N	none	1
28724	CIGARRILLOS PHILIPS MENTOLADO DE 10		CIGARRILLOSSSSSS	3212.00	3700.00	11.000	51	CIGARRILLOSSSSSS.jpg	2026-01-17 11:39:29.948289-03	2026-01-17 11:39:29.948289-03	f	\N	f	t	\N	\N	none	1
28725	ALMACEN RAMEN ARCOR		RAMENNNNN	942.70	1200.00	5.000	21	RAMENNNNN.jpg	2026-01-17 11:39:29.951335-03	2026-01-17 11:39:29.951335-03	f	\N	f	t	\N	\N	none	1
28726	VERDULERIA NARANJA 🍊		NARANJAAAAASA	841.50	1200.00	11.610	27	NARANJAAAAASA.jpg	2026-01-17 11:39:29.954419-03	2026-01-17 11:39:29.954419-03	f	\N	f	t	\N	\N	none	1
28727	ALMACEN BOLSA PARA HORNO ALICANTE		7790150498057	1932.70	2500.00	3.000	21	7790150498057.jpg	2026-01-17 11:39:29.95867-03	2026-01-17 11:39:29.95867-03	f	\N	f	t	\N	\N	none	1
28728	BODEGA SIDRA DEL VALLE		7792716930513	2337.50	3000.00	8.000	37	7792716930513.jpg	2026-01-17 11:39:29.960927-03	2026-01-17 11:39:29.960927-03	f	\N	f	t	\N	\N	none	1
28729	ART.LIMPIEZA SELTON INSECTICIDA		SELTONNNNN	4048.00	5500.00	5.000	29	SELTONNNNN.jpg	2026-01-17 11:39:29.96309-03	2026-01-17 11:39:29.96309-03	f	\N	f	t	\N	\N	none	1
28730	BEBIDA 1888		91001894	7166.50	8800.00	8.000	19	91001894.jpg	2026-01-17 11:39:29.965486-03	2026-01-17 11:39:29.965486-03	f	\N	f	t	\N	\N	none	1
28731	ALMACEN BRIWNIE RAVANA		BROWNIEEEERR	2673.00	3300.00	2.000	21	BROWNIEEEERR.jpg	2026-01-17 11:39:29.968875-03	2026-01-17 11:39:29.968875-03	f	\N	f	t	\N	\N	none	1
28732	CIGARRILLOS ORIGEN MENTA BOX		ORIGENNNNN	3421.00	3600.00	8.000	51	ORIGENNNNN.jpg	2026-01-17 11:39:29.972198-03	2026-01-17 11:39:29.972198-03	f	\N	f	t	\N	\N	none	1
28733	BODEGA SANTA JULIA MALBEC		SANTAAAAAA	4174.50	5200.00	6.000	37	SANTAAAAAA.jpg	2026-01-17 11:39:29.975391-03	2026-01-17 11:39:29.975391-03	f	\N	f	t	\N	\N	none	1
28734	BODEGA CORDERO CON PIEL DE LOBO MALBEC		CORDEROOOOO	4049.10	5000.00	6.000	37	CORDEROOOOO.jpg	2026-01-17 11:39:29.977913-03	2026-01-17 11:39:29.977913-03	f	\N	f	t	\N	\N	none	1
28735	ALMACEN BOMBUCHAS PERFUMADOS		BOMBUCHASSSSSS	1276.00	1700.00	9.000	21	BOMBUCHASSSSSS.jpg	2026-01-17 11:39:29.979977-03	2026-01-17 11:39:29.979977-03	f	\N	f	t	\N	\N	none	1
28736	ALMACEN REDUCIDA EN LACTOSA		LECHEEEEEED	1839.20	2300.00	2.000	21	LECHEEEEEED.jpg	2026-01-17 11:39:29.982182-03	2026-01-17 11:39:29.982182-03	f	\N	f	t	\N	\N	none	1
28737	ART.LIMPIEZA AYUDIN X2L		AYUDINNNNN	1978.90	2600.00	6.000	29	AYUDINNNNN.jpg	2026-01-17 11:39:29.985024-03	2026-01-17 11:39:29.985024-03	f	\N	f	t	\N	\N	none	1
28738	ALMACEN ARROZ TOBOGAN		7791830002205	605.00	1000.00	10.000	21	7791830002205.jpg	2026-01-17 11:39:29.987358-03	2026-01-17 11:39:29.987358-03	f	\N	f	t	\N	\N	none	1
28739	ALMACEN DORITOS X40G		7790310985267	1323.30	1750.00	70.000	21	7790310985267.jpg	2026-01-17 11:39:29.989435-03	2026-01-17 11:39:29.989435-03	f	\N	f	t	\N	\N	none	1
28740	Rexona Efficient 100g	\N	7791293044477	2000.00	2500.00	4.000	33	/uploads/00f3b713-858d-4d4a-a8b5-a9b736a86cb3.jpg	2026-01-17 11:47:56.339834-03	2026-01-17 11:47:56.339834-03	f	\N	f	t	\N	\N	none	1
26672	AGUA AGUA MANOS X 600		7798113300270	339.90	500.00	6.000	23	/uploads/7798113300270.jpg	2026-01-12 15:55:54.581614-03	2026-01-17 11:39:21.759392-03	f	\N	f	t	\N	\N	none	1
26670	AGUA AQUARIUS X2¼		7790895003288	1799.60	2250.00	5.000	23	/uploads/7790895003288.jpg	2026-01-12 15:55:54.547619-03	2026-01-17 11:39:21.732682-03	f	\N	f	t	\N	\N	none	1
26671	AGUA AGUA MANAOS	\N	7798113301611	605.00	800.00	42.000	23	/uploads/7798113301611.jpg	2026-01-12 15:55:54.575902-03	2026-01-17 11:39:21.751372-03	f	\N	f	t	\N	\N	none	1
26678	AGUA JUGO ADES		7790895643866	1964.60	2400.00	3.000	44	/uploads/7790895643866.jpg	2026-01-12 15:55:54.62154-03	2026-01-17 11:39:21.807718-03	f	\N	f	t	\N	\N	none	1
26709	ALMACEN ATUN DESMENUZADO AL NATURAL		7791885001550	1200.10	1700.00	0.000	21	/uploads/7791885001550.jpg	2026-01-12 15:55:54.782395-03	2026-01-17 11:39:22.02587-03	f	\N	f	t	\N	\N	none	1
26674	AGUA BAGGIO JUGO C.PULPA		7790036000367	1635.70	2100.00	9.000	44	/uploads/7790036000367.jpg	2026-01-12 15:55:54.594992-03	2026-01-17 11:39:21.782148-03	f	\N	f	t	\N	\N	none	1
26676	AGUA FRESH POMELO		7790036001579	1171.50	1400.00	-17.000	23	/uploads/7790036001579.jpg	2026-01-12 15:55:54.607755-03	2026-01-17 11:39:21.795132-03	f	\N	f	t	\N	\N	none	1
26677	AGUA GAS.SODA MANAOS		7798113301529	1207.80	1550.00	18.000	49	/uploads/7798113301529.jpg	2026-01-12 15:55:54.616089-03	2026-01-17 11:39:21.801107-03	f	\N	f	t	\N	\N	none	1
26679	AGUA JUGO BAGGIO X200		7790036000619	475.20	650.00	7.000	44	/uploads/7790036000619.jpg	2026-01-12 15:55:54.626106-03	2026-01-17 11:39:21.814244-03	f	\N	f	t	\N	\N	none	1
26681	AGUA LEVITE POMELO X1½		7798062548679	1999.80	2500.00	-1.000	23	/uploads/7798062548679.jpg	2026-01-12 15:55:54.637518-03	2026-01-17 11:39:21.829774-03	f	\N	f	t	\N	\N	none	1
26682	AGUA PLACER MANZANA		7798113302076	904.20	1200.00	35.000	23	/uploads/7798113302076.jpg	2026-01-12 15:55:54.643583-03	2026-01-17 11:39:21.838033-03	f	\N	f	t	\N	\N	none	1
26683	MASCOTAS GAT  CHOW X15K		8445290067630	4567.20	5750.00	14974.642	28	/uploads/8445290067630.jpg	2026-01-12 15:55:54.650667-03	2026-01-17 11:39:21.847859-03	f	\N	f	t	\N	\N	none	1
26685	ALMACEN ACEITE CAÑUELA X900		7792180009241	2737.90	3400.00	-3.000	21	/uploads/7792180009241.jpg	2026-01-12 15:55:54.664633-03	2026-01-17 11:39:21.862065-03	f	\N	f	t	\N	\N	none	1
26686	ALMACEN ACEITE MESCLA		7790060234868	0.00	0.00	0.000	21	/uploads/7790060234868.jpg	2026-01-12 15:55:54.670621-03	2026-01-17 11:39:21.869261-03	f	\N	f	t	\N	\N	none	1
26687	ALMACEN ACEITE NATURA X 500ML		7790272001050	0.00	0.00	0.000	21	/uploads/7790272001050.jpg	2026-01-12 15:55:54.676214-03	2026-01-17 11:39:21.877915-03	f	\N	f	t	\N	\N	none	1
26688	ALMACEN ACEITE NATURA X1/15		7790272001029	0.00	0.00	0.000	21	/uploads/7790272001029.jpg	2026-01-12 15:55:54.681939-03	2026-01-17 11:39:21.88484-03	f	\N	f	t	\N	\N	none	1
26690	ALMACEN ACEITUNAS RELLENAS		7798158680818	13915.00	18000.00	-1.190	21	/uploads/7798158680818.jpg	2026-01-12 15:55:54.693975-03	2026-01-17 11:39:21.897944-03	f	\N	f	t	\N	\N	none	1
26691	ALMACEN ANANA LATA CUMANA 565 GMS		7791885004810	0.00	0.00	0.000	21	/uploads/7791885004810.jpg	2026-01-12 15:55:54.700188-03	2026-01-17 11:39:21.904445-03	f	\N	f	t	\N	\N	none	1
26692	ALMACEN ANCHOAS PAQUETITO X3 UNI		7798158681563	697.40	1000.00	-6.000	21	/uploads/7798158681563.jpg	2026-01-12 15:55:54.704394-03	2026-01-17 11:39:21.911042-03	f	\N	f	t	\N	\N	none	1
26693	ALMACEN HARINA PUREZA INTEGRAL		7792180134516	1191.30	1600.00	3.000	21	/uploads/7792180134516.jpg	2026-01-12 15:55:54.710639-03	2026-01-17 11:39:21.917067-03	f	\N	f	t	\N	\N	none	1
26695	ALMACEN ARROZ GALLO 500G		7790070411839	0.00	0.00	0.000	21	/uploads/7790070411839.jpg	2026-01-12 15:55:54.719388-03	2026-01-17 11:39:21.930134-03	f	\N	f	t	\N	\N	none	1
26696	ALMACEN ARROZ GALLO ORO		7790070411716	0.00	0.00	0.000	21	/uploads/7790070411716.jpg	2026-01-12 15:55:54.724606-03	2026-01-17 11:39:21.941797-03	f	\N	f	t	\N	\N	none	1
26697	ALMACEN ARROZ INTEGRAL VANGUARDIA		7798078450263	0.00	0.00	0.000	21	/uploads/7798078450263.jpg	2026-01-12 15:55:54.730763-03	2026-01-17 11:39:21.948542-03	f	\N	f	t	\N	\N	none	1
26698	ALMACEN ARROZ LUCCHETI NO SE PASA NI SE PEGA		7790070411822	915.20	1600.00	9.000	21	/uploads/7790070411822.jpg	2026-01-12 15:55:54.736016-03	2026-01-17 11:39:21.953974-03	f	\N	f	t	\N	\N	none	1
26700	ALMACEN ARROZ MOLINOS ALA X 500G		7791120031564	622.60	1300.00	2.000	21	/uploads/7791120031564.jpg	2026-01-12 15:55:54.745141-03	2026-01-17 11:39:21.966685-03	f	\N	f	t	\N	\N	none	1
26701	ALMACEN ARROZ MOLINOS ALA X 500G DOBLE CAROLINA		7791120021565	0.00	0.00	0.000	21	/uploads/7791120021565.jpg	2026-01-12 15:55:54.749236-03	2026-01-17 11:39:21.97365-03	f	\N	f	t	\N	\N	none	1
26702	ALMACEN ARROZ MONEDA X 500G		7791830000058	558.80	1000.00	-4.000	21	/uploads/7791830000058.jpg	2026-01-12 15:55:54.752761-03	2026-01-17 11:39:21.979512-03	f	\N	f	t	\N	\N	none	1
26703	ALMACEN ARROZ MONEDA X KG		7791830000065	1351.90	2100.00	1.000	21	/uploads/7791830000065.jpg	2026-01-12 15:55:54.75621-03	2026-01-17 11:39:21.98554-03	f	\N	f	t	\N	\N	none	1
26704	ALMACEN ARROZ VANGUARDIA 500		7798078450393	554.40	900.00	6.000	21	/uploads/7798078450393.jpg	2026-01-12 15:55:54.760822-03	2026-01-17 11:39:21.990931-03	f	\N	f	t	\N	\N	none	1
26706	ALMACEN ARVEJAS CUNMANA		7791885325007	568.70	750.00	2.000	21	/uploads/7791885325007.jpg	2026-01-12 15:55:54.770337-03	2026-01-17 11:39:22.00245-03	f	\N	f	t	\N	\N	none	1
26707	ALMACEN ARVEJAS MOLTO		7798138552838	493.90	850.00	34.000	21	/uploads/7798138552838.jpg	2026-01-12 15:55:54.773924-03	2026-01-17 11:39:22.014621-03	f	\N	f	t	\N	\N	none	1
26708	ALMACEN ATUN DESMENUSADO CUMCNA		7791885001208	1200.10	1700.00	2.000	21	/uploads/7791885001208.jpg	2026-01-12 15:55:54.777738-03	2026-01-17 11:39:22.020502-03	f	\N	f	t	\N	\N	none	1
26711	ALMACEN ATUN LOMITO CUMANA AL NATURAL		7791885004087	2424.40	3200.00	3.000	21	/uploads/7791885004087.jpg	2026-01-12 15:55:54.793352-03	2026-01-17 11:39:22.031178-03	f	\N	f	t	\N	\N	none	1
26712	ALMACEN AVENA SUELTA X KILO		7798016190817	2332.00	3500.00	1.000	21	/uploads/7798016190817.jpg	2026-01-12 15:55:54.798851-03	2026-01-17 11:39:22.048337-03	f	\N	f	t	\N	\N	none	1
26713	ALMACEN AZUCAR FUGAZ		7798918990188	906.40	1350.00	10.000	21	/uploads/7798918990188.jpg	2026-01-12 15:55:54.804236-03	2026-01-17 11:39:22.054669-03	f	\N	f	t	\N	\N	none	1
26714	ALMACEN AZUCAR HILERET X 500G		7794940000536	1787.50	2200.00	2.000	21	/uploads/7794940000536.jpg	2026-01-12 15:55:54.80989-03	2026-01-17 11:39:22.061247-03	f	\N	f	t	\N	\N	none	1
26715	ALMACEN AZUCAR HILERET X250		7794940000550	855.80	1350.00	4.000	21	/uploads/7794940000550.jpg	2026-01-12 15:55:54.815485-03	2026-01-17 11:39:22.067192-03	f	\N	f	t	\N	\N	none	1
26717	ALMACEN AZUCAR LEDEZMA		7792540260138	1131.90	1600.00	3.000	21	/uploads/7792540260138.jpg	2026-01-12 15:55:54.827433-03	2026-01-17 11:39:22.079977-03	f	\N	f	t	\N	\N	none	1
26718	ALMACEN AZUFRE SUELTO X UNIDAD		AZUFRE	89.10	150.00	-1.000	21	/uploads/AZUFRE.jpg	2026-01-12 15:55:54.833869-03	2026-01-17 11:39:22.086022-03	f	\N	f	t	\N	\N	none	1
26720	ALMACEN BALONCITOS DE CHOCOLATE		7790045000457	1206.70	1800.00	-1.000	21	/uploads/7790045000457.jpg	2026-01-12 15:55:54.844642-03	2026-01-17 11:39:22.092597-03	f	\N	f	t	\N	\N	none	1
26722	ALMACEN BENGALITAS		111111111	1045.00	1500.00	1.000	21	/uploads/111111111.jpg	2026-01-12 15:55:54.8532-03	2026-01-17 11:39:22.103434-03	f	\N	f	t	\N	\N	none	1
26723	ALMACEN BISCOCHUELO  EMETH CHOCOLATE		7791113004605	1593.90	1950.00	-3.000	21	/uploads/7791113004605.jpg	2026-01-12 15:55:54.857185-03	2026-01-17 11:39:22.110133-03	f	\N	f	t	\N	\N	none	1
26724	ALMACEN BISCOCHUELO EMETH VAINILLA		7791113004599	1295.80	1870.00	-7.000	21	/uploads/7791113004599.jpg	2026-01-12 15:55:54.861938-03	2026-01-17 11:39:22.115779-03	f	\N	f	t	\N	\N	none	1
26725	ALMACEN BISCOCHUELO EXQUISITA VAINILLA		7790070410139	0.00	0.00	0.000	21	/uploads/7790070410139.jpg	2026-01-12 15:55:54.865958-03	2026-01-17 11:39:22.121608-03	f	\N	f	t	\N	\N	none	1
26727	ALMACEN BISCOCHULO RAVANA VAINILLA		7790971000170	1672.00	2200.00	-1.000	21	/uploads/7790971000170.jpg	2026-01-12 15:55:54.874938-03	2026-01-17 11:39:22.136559-03	f	\N	f	t	\N	\N	none	1
26728	ALMACEN BISCOCUELO EXQUISITA CHOCOLATE		7790070410146	0.00	0.00	0.000	21	/uploads/7790070410146.jpg	2026-01-12 15:55:54.879739-03	2026-01-17 11:39:22.141981-03	f	\N	f	t	\N	\N	none	1
26729	ALMACEN BOLSAS PARA HORNO CARNE		7794000004900	2330.90	2900.00	9.000	21	/uploads/7794000004900.jpg	2026-01-12 15:55:54.929365-03	2026-01-17 11:39:22.148263-03	f	\N	f	t	\N	\N	none	1
26719	ALMACEN ACEITE COCINERO GIRASOL X 900ML		7790070012050	1468.00	7762.50	-9.000	21	/uploads/7790070012050.jpg	2026-01-12 15:55:54.840149-03	2026-01-12 15:55:54.840149-03	f	\N	f	t	\N	\N	none	1
26730	ALMACEN BOLSITAS HORNO		7794000004887	1510.00	6885.00	4.000	21	/uploads/7794000004887.jpg	2026-01-12 15:55:54.978888-03	2026-01-12 15:55:54.978888-03	f	\N	f	t	\N	\N	none	1
26777	ALMACEN DURAZNOS CUMANA		7791885004407	2086.70	2600.00	0.000	21	/uploads/7791885004407.jpg	2026-01-12 15:55:55.2318-03	2026-01-17 11:39:22.426853-03	f	\N	f	t	\N	\N	none	1
26733	ALMACEN CABALLA AL ACEITE CUMANA		7791885005442	3591.50	4500.00	1.000	21	/uploads/7791885005442.jpg	2026-01-12 15:55:54.992635-03	2026-01-17 11:39:22.166492-03	f	\N	f	t	\N	\N	none	1
26735	ALMACEN CAFE ARLISTAN X 100G		7790070936493	4491.30	5500.00	8.000	21	/uploads/7790070936493.jpg	2026-01-12 15:55:55.00174-03	2026-01-17 11:39:22.177579-03	f	\N	f	t	\N	\N	none	1
26736	ALMACEN CAFE ARLISTAN X 50G		7790070936516	2376.00	3000.00	-2.000	21	/uploads/7790070936516.jpg	2026-01-12 15:55:55.008309-03	2026-01-17 11:39:22.183185-03	f	\N	f	t	\N	\N	none	1
26737	ALMACEN CAFE BONAFIDE SENSACIONES SAQUITO		7792360070153	0.00	0.00	0.000	21	/uploads/7792360070153.jpg	2026-01-12 15:55:55.013258-03	2026-01-17 11:39:22.190075-03	f	\N	f	t	\N	\N	none	1
26738	ALMACEN CAFE LA VIRGINIA		7790150100356	0.00	0.00	0.000	21	/uploads/7790150100356.jpg	2026-01-12 15:55:55.018554-03	2026-01-17 11:39:22.19698-03	f	\N	f	t	\N	\N	none	1
26739	ALMACEN CAFE LA VIRGINIA X100		7790150100752	2865.50	3550.00	-1.000	21	/uploads/7790150100752.jpg	2026-01-12 15:55:55.024117-03	2026-01-17 11:39:22.203069-03	f	\N	f	t	\N	\N	none	1
26741	ALMACEN CAFE MORENITA 125G		7790170901957	2581.70	3200.00	-3.000	21	/uploads/7790170901957.jpg	2026-01-12 15:55:55.03443-03	2026-01-17 11:39:22.215412-03	f	\N	f	t	\N	\N	none	1
26742	ALMACEN CAFE MORENITA 250		7790170901971	4116.20	5100.00	-1.000	21	/uploads/7790170901971.jpg	2026-01-12 15:55:55.085014-03	2026-01-17 11:39:22.22099-03	f	\N	f	t	\N	\N	none	1
26743	ALMACEN CAFE SAQUITO LA MORENITA		7790170903937	198.00	300.00	52.000	21	/uploads/7790170903937.jpg	2026-01-12 15:55:55.090351-03	2026-01-17 11:39:22.227546-03	f	\N	f	t	\N	\N	none	1
26744	ALMACEN CALDO GALLINA X12		7794000003675	0.00	0.00	0.000	21	/uploads/7794000003675.jpg	2026-01-12 15:55:55.094447-03	2026-01-17 11:39:22.232953-03	f	\N	f	t	\N	\N	none	1
26745	ALMACEN CALDO GALLINA X6		7794000003774	869.00	1150.00	1.000	21	/uploads/7794000003774.jpg	2026-01-12 15:55:55.099246-03	2026-01-17 11:39:22.238696-03	f	\N	f	t	\N	\N	none	1
26747	ALMACEN CALDO KNORR GALLINA		7794000003835	0.00	0.00	0.000	21	/uploads/7794000003835.jpg	2026-01-12 15:55:55.108279-03	2026-01-17 11:39:22.249408-03	f	\N	f	t	\N	\N	none	1
26748	ALMACEN CALDO KNORR VERDURAS X2		7794000005662	451.00	600.00	3.000	21	/uploads/7794000005662.jpg	2026-01-12 15:55:55.113384-03	2026-01-17 11:39:22.254696-03	f	\N	f	t	\N	\N	none	1
26749	ALMACEN CALDOS KNORR X 12		7794000003668	0.00	0.00	0.000	21	/uploads/7794000003668.jpg	2026-01-12 15:55:55.118041-03	2026-01-17 11:39:22.259892-03	f	\N	f	t	\N	\N	none	1
26751	ALMACEN CAPUCHINO LA VIRGINIA X 210		7790150160787	0.00	0.00	0.000	21	/uploads/7790150160787.jpg	2026-01-12 15:55:55.125197-03	2026-01-17 11:39:22.270074-03	f	\N	f	t	\N	\N	none	1
26752	ALMACEN CAPUCHINO SOBRE		7790150160657	256.30	450.00	17.000	21	/uploads/7790150160657.jpg	2026-01-12 15:55:55.129219-03	2026-01-17 11:39:22.275423-03	f	\N	f	t	\N	\N	none	1
26753	ALMACEN CARACOLITOS PEHUAMAR		7790310984925	0.00	0.00	0.000	21	/uploads/7790310984925.jpg	2026-01-12 15:55:55.132784-03	2026-01-17 11:39:22.281899-03	f	\N	f	t	\N	\N	none	1
26754	ALMACEN CARBBBON		CARBON ECONOMICO	2585.00	3300.00	-22.000	21	\N	2026-01-12 15:55:55.137178-03	2026-01-17 11:39:22.287689-03	f	\N	f	t	\N	\N	none	1
26755	ALMACEN CEREAL SKRACHITOS AZUCARADOS		7790045001607	1338.70	1750.00	16.000	21	/uploads/7790045001607.jpg	2026-01-12 15:55:55.141179-03	2026-01-17 11:39:22.293036-03	f	\N	f	t	\N	\N	none	1
26756	ALMACEN CEREALES CHOCOFORTIS		7790045001621	0.00	0.00	-1.000	21	/uploads/7790045001621.jpg	2026-01-12 15:55:55.144779-03	2026-01-17 11:39:22.298476-03	f	\N	f	t	\N	\N	none	1
26758	ALMACEN CHICITOS LEQ		7797429002014	0.00	0.00	0.000	21	/uploads/7797429002014.jpg	2026-01-12 15:55:55.15246-03	2026-01-17 11:39:22.31104-03	f	\N	f	t	\N	\N	none	1
26759	ALMACEN CHICITOS PEHUAMAR X100G		7790310984345	15886.20	19500.00	-1.331	21	/uploads/7790310984345.jpg	2026-01-12 15:55:55.156183-03	2026-01-17 11:39:22.316659-03	f	\N	f	t	\N	\N	none	1
26760	ALMACEN CHIMICHURRI CLASICO		7798361530436	0.00	0.00	0.000	21	/uploads/7798361530436.jpg	2026-01-12 15:55:55.159829-03	2026-01-17 11:39:22.323039-03	f	\N	f	t	\N	\N	none	1
26761	ALMACEN CHIPA EMETH		7791113004780	2039.40	2400.00	4.000	21	/uploads/7791113004780.jpg	2026-01-12 15:55:55.163191-03	2026-01-17 11:39:22.329026-03	f	\N	f	t	\N	\N	none	1
26763	ALMACEN CHOCOLATADA TODY X 180GS		7798153810012	772.20	1000.00	-13.000	21	/uploads/7798153810012.jpg	2026-01-12 15:55:55.172332-03	2026-01-17 11:39:22.340199-03	f	\N	f	t	\N	\N	none	1
26764	ALMACEN CINDOR X 1LTS	Compré en oferta	7791337003255	4189.90	4200.00	-1.000	21	/uploads/7791337003255.jpg	2026-01-12 15:55:55.176652-03	2026-01-17 11:39:22.34695-03	f	\N	f	t	\N	\N	none	1
26765	ALMACEN CINDOR X200		7791337005624	1323.30	1600.00	2.000	21	/uploads/7791337005624.jpg	2026-01-12 15:55:55.180499-03	2026-01-17 11:39:22.352662-03	f	\N	f	t	\N	\N	none	1
26766	ALMACEN COCTEL DE FRUTAS CUMANA		7791885004223	3642.10	4100.00	3.000	21	/uploads/7791885004223.jpg	2026-01-12 15:55:55.184169-03	2026-01-17 11:39:22.358491-03	f	\N	f	t	\N	\N	none	1
26769	ALMACEN CONITOS 3 LEQ		7797429004001	0.00	0.00	0.000	21	/uploads/7797429004001.jpg	2026-01-12 15:55:55.197722-03	2026-01-17 11:39:22.377662-03	f	\N	f	t	\N	\N	none	1
26770	ALMACEN COPOS DE MAIZ		7790045001584	830.50	1100.00	1.000	21	/uploads/7790045001584.jpg	2026-01-12 15:55:55.202161-03	2026-01-17 11:39:22.383427-03	f	\N	f	t	\N	\N	none	1
26771	ALMACEN DELICIA X 500GS		7791620001074	0.00	0.00	0.000	21	/uploads/7791620001074.jpg	2026-01-12 15:55:55.20616-03	2026-01-17 11:39:22.389863-03	f	\N	f	t	\N	\N	none	1
26773	ALMACEN DULCE DE LECHE X250		7790742625106	1989.90	2500.00	4.000	21	/uploads/7790742625106.jpg	2026-01-12 15:55:55.213568-03	2026-01-17 11:39:22.401815-03	f	\N	f	t	\N	\N	none	1
26774	ALMACEN DULCE DE LECHE X400		7790742625205	2711.50	3450.00	2.000	21	/uploads/7790742625205.jpg	2026-01-12 15:55:55.217144-03	2026-01-17 11:39:22.40759-03	f	\N	f	t	\N	\N	none	1
26775	ALMACEN DULCES BATATA, MEMBRILLO		7791918000062	2817.10	4000.00	1.480	21	/uploads/7791918000062.jpg	2026-01-12 15:55:55.222026-03	2026-01-17 11:39:22.414084-03	f	\N	f	t	\N	\N	none	1
26776	ALMACEN DURAZNO RIO SALADO		7798106150028	1430.00	2000.00	-3.000	21	/uploads/7798106150028.jpg	2026-01-12 15:55:55.226829-03	2026-01-17 11:39:22.421261-03	f	\N	f	t	\N	\N	none	1
26779	ALMACEN ESENCIA VAINILLA DOS ANCLAS		7792900092911	1515.80	1950.00	0.000	21	/uploads/7792900092911.jpg	2026-01-12 15:55:55.242693-03	2026-01-17 11:39:22.437754-03	f	\N	f	t	\N	\N	none	1
26780	ALMACEN ESPECIAS SURTIDAS		7790150510308	66.00	600.00	7.000	21	/uploads/7790150510308.jpg	2026-01-12 15:55:55.247395-03	2026-01-17 11:39:22.443349-03	f	\N	f	t	\N	\N	none	1
26781	ALMACEN EXTRACTO DE TOMATE INCA		7798144510457	816.20	1150.00	6.000	21	/uploads/7798144510457.jpg	2026-01-12 15:55:55.251374-03	2026-01-17 11:39:22.449603-03	f	\N	f	t	\N	\N	none	1
26782	ALMACEN FACTURAS X DOCENA		PANADERIA111111	0.00	0.00	0.000	21	/uploads/PANADERIA111111.jpg	2026-01-12 15:55:55.254922-03	2026-01-17 11:39:22.455622-03	f	\N	f	t	\N	\N	none	1
26784	ALMACEN FIDEO CABELLO DE ANGEL QUE RICO		7794059000182	1789.70	2200.00	0.000	21	/uploads/7794059000182.jpg	2026-01-12 15:55:55.263457-03	2026-01-17 11:39:22.467842-03	f	\N	f	t	\N	\N	none	1
26785	ALMACEN FIDEO DE SOL PAMPEANO TIRABUZON		7798031154290	737.00	1000.00	3.000	21	/uploads/7798031154290.jpg	2026-01-12 15:55:55.268024-03	2026-01-17 11:39:22.474244-03	f	\N	f	t	\N	\N	none	1
26786	ALMACEN FIDEO DON V. TIRA BUZON		7790070318176	0.00	0.00	0.000	21	/uploads/7790070318176.jpg	2026-01-12 15:55:55.273441-03	2026-01-17 11:39:22.479131-03	f	\N	f	t	\N	\N	none	1
26787	ALMACEN FIDEO LUCCHETTI MOÑO		1234567	0.00	0.00	0.000	21	/uploads/12345678.jpg	2026-01-12 15:55:55.279098-03	2026-01-17 11:39:22.483788-03	f	\N	f	t	\N	\N	none	1
26789	ALMACEN FIDEOS A LA BUENA DE DIOS ROSCA		7794711000017	0.00	0.00	0.000	21	/uploads/7794711000017.jpg	2026-01-12 15:55:55.289452-03	2026-01-17 11:39:22.494118-03	f	\N	f	t	\N	\N	none	1
26790	ALMACEN FIDEOS CHIETTI		7794585000014	0.00	0.00	0.000	21	/uploads/7794585000014.jpg	2026-01-12 15:55:55.294146-03	2026-01-17 11:39:22.500589-03	f	\N	f	t	\N	\N	none	1
26840	ALMACEN JARDINERA CUMANA		7791885328008	937.20	1150.00	2.000	21	/uploads/7791885328008.jpg	2026-01-12 15:55:55.493791-03	2026-01-17 11:39:22.772062-03	f	\N	f	t	\N	\N	none	1
26791	ALMACEN FIDEOS DON VICENTE		7790070318114	2509.10	2950.00	19.000	21	/uploads/7790070318114.jpg	2026-01-12 15:55:55.299336-03	2026-01-17 11:39:22.507872-03	f	\N	f	t	\N	\N	none	1
26792	ALMACEN FIDEOS LICCHETTI AVE MARIA		7790070318374	0.00	0.00	0.000	21	/uploads/7790070318374.jpg	2026-01-12 15:55:55.30449-03	2026-01-17 11:39:22.513239-03	f	\N	f	t	\N	\N	none	1
26793	ALMACEN FIDEO LUCCHETTI CABELLOS DE ANGEL		7790070320155	1617.00	2000.00	0.000	21	/uploads/7790070320155.jpg	2026-01-12 15:55:55.310551-03	2026-01-17 11:39:22.518273-03	f	\N	f	t	\N	\N	none	1
26794	ALMACEN FIDEOS LICCHETTI TALLARIN		4892013041691	0.00	0.00	0.000	21	/uploads/4892013041691.jpg	2026-01-12 15:55:55.315656-03	2026-01-17 11:39:22.523385-03	f	\N	f	t	\N	\N	none	1
26796	ALMACEN FIDEOS LUCCHETTI  MOSTACHOL		7790070318336	0.00	0.00	0.000	21	/uploads/7790070318336.jpg	2026-01-12 15:55:55.326565-03	2026-01-17 11:39:22.534455-03	f	\N	f	t	\N	\N	none	1
26797	ALMACEN FIDEOS MATARAZO DEDALITOS		7790070320025	0.00	0.00	0.000	21	/uploads/7790070320025.jpg	2026-01-12 15:55:55.331981-03	2026-01-17 11:39:22.539609-03	f	\N	f	t	\N	\N	none	1
26798	ALMACEN FIDEOS MATARAZO MOÑOS		7790230033031	0.00	0.00	0.000	21	/uploads/7790230033031.jpg	2026-01-12 15:55:55.337179-03	2026-01-17 11:39:22.545411-03	f	\N	f	t	\N	\N	none	1
26799	ALMACEN FIDEOS MATARAZO TIRABUZON		7790070318602	0.00	0.00	0.000	21	/uploads/7790070318602.jpg	2026-01-12 15:55:55.340855-03	2026-01-17 11:39:22.55135-03	f	\N	f	t	\N	\N	none	1
26801	ALMACEN FIDEO SOL PAMPEANO MOÑO		7798031150988	910.80	1300.00	25.000	21	/uploads/7798031150988.jpg	2026-01-12 15:55:55.350141-03	2026-01-17 11:39:22.562057-03	f	\N	f	t	\N	\N	none	1
26802	ALMACEN FIDEOS QUE RICO		7794059000229	1789.70	2200.00	9.000	21	/uploads/7794059000229.jpg	2026-01-12 15:55:55.35501-03	2026-01-17 11:39:22.567674-03	f	\N	f	t	\N	\N	none	1
26803	ALMACEN FIDEOS SOL PAMPEANO MOSTACHOL  RAYADO		7798031153835	663.30	1000.00	49.000	21	/uploads/7798031153835.jpg	2026-01-12 15:55:55.359601-03	2026-01-17 11:39:22.57305-03	f	\N	f	t	\N	\N	none	1
26804	ALMACEN FIDEOS SPAGHETTI		7790070318640	0.00	0.00	0.000	21	/uploads/7790070318640.jpg	2026-01-12 15:55:55.364392-03	2026-01-17 11:39:22.579091-03	f	\N	f	t	\N	\N	none	1
26806	ALMACEN FLAN RAVANA		7790971001931	605.00	900.00	5.000	21	/uploads/7790971001931.jpg	2026-01-12 15:55:55.376112-03	2026-01-17 11:39:22.592482-03	f	\N	f	t	\N	\N	none	1
26807	ALMACEN FOSFOROS PATITO		7790590000841	473.00	750.00	4.000	21	/uploads/7790590000841.jpg	2026-01-12 15:55:55.381744-03	2026-01-17 11:39:22.599824-03	f	\N	f	t	\N	\N	none	1
26808	ALMACEN GARBANZOS		7790790120325	489.50	650.00	0.000	21	/uploads/7790790120325.jpg	2026-01-12 15:55:55.386953-03	2026-01-17 11:39:22.606482-03	f	\N	f	t	\N	\N	none	1
26813	ALMACEN GELATINA LIGHT CEREZA		7790971002211	0.00	0.00	0.000	21	/uploads/7790971002211.jpg	2026-01-12 15:55:55.411116-03	2026-01-17 11:39:22.619324-03	f	\N	f	t	\N	\N	none	1
26814	ALMACEN GELATINA LIGHT FRUTILLA		7790971000491	753.50	1000.00	-4.000	21	/uploads/7790971000491.jpg	2026-01-12 15:55:55.413907-03	2026-01-17 11:39:22.624792-03	f	\N	f	t	\N	\N	none	1
26815	ALMACEN GELATINA SIN SABOR		7790971001801	1277.10	1570.00	0.000	21	/uploads/7790971001801.jpg	2026-01-12 15:55:55.416615-03	2026-01-17 11:39:22.630272-03	f	\N	f	t	\N	\N	none	1
26817	ALMACEN GOOD SHOW BATATA		7798112160226	0.00	0.00	0.000	21	/uploads/7798112160226.jpg	2026-01-12 15:55:55.423181-03	2026-01-17 11:39:22.641168-03	f	\N	f	t	\N	\N	none	1
26818	ALMACEN GOOD SHOW HUEVO FRITO		7798112601170	0.00	0.00	0.000	21	/uploads/7798112601170.jpg	2026-01-12 15:55:55.428222-03	2026-01-17 11:39:22.64642-03	f	\N	f	t	\N	\N	none	1
26819	ALMACEN GOOD SHOW PAPS ESPAÑOLAS		7798112601279	0.00	0.00	0.000	21	/uploads/7798112601279.jpg	2026-01-12 15:55:55.432608-03	2026-01-17 11:39:22.651502-03	f	\N	f	t	\N	\N	none	1
26820	ALMACEN GOOD SHW JAMON		7798112601163	0.00	0.00	0.000	21	/uploads/7798112601163.jpg	2026-01-12 15:55:55.436715-03	2026-01-17 11:39:22.656918-03	f	\N	f	t	\N	\N	none	1
26822	ALMACEN GRASA CRISTALINA		7798033130476	1992.10	2600.00	3.000	21	/uploads/7798033130476.jpg	2026-01-12 15:55:55.442406-03	2026-01-17 11:39:22.669647-03	f	\N	f	t	\N	\N	none	1
26823	ALMACEN GRASA HALCON		7790521000018	1622.50	2000.00	0.000	21	/uploads/7790521000018.jpg	2026-01-12 15:55:55.44515-03	2026-01-17 11:39:22.676629-03	f	\N	f	t	\N	\N	none	1
26824	CONGELADOS HAMBURGUESAS CHAMPION		7796804050138	1907.40	2500.00	11.000	17	/uploads/7796804050138.jpg	2026-01-12 15:55:55.448093-03	2026-01-17 11:39:22.682976-03	f	\N	f	t	\N	\N	none	1
26827	ALMACEN HARINA LEUDANTE BLANCA FLOR		7790070507228	1701.70	2000.00	11.000	21	/uploads/7790070507228.jpg	2026-01-12 15:55:55.457336-03	2026-01-17 11:39:22.700574-03	f	\N	f	t	\N	\N	none	1
26809	ALMACEN GELATINA DE CERZA		7790971002150	463.00	2868.75	-10.000	21	/uploads/7790971002150.jpg	2026-01-12 15:55:55.391474-03	2026-01-12 15:55:55.391474-03	f	\N	f	t	\N	\N	none	1
26811	ALMACEN GELATINA DE MANZANA		7790971002181	622.00	2868.75	2.000	21	/uploads/7790971002181.jpg	2026-01-12 15:55:55.403841-03	2026-01-12 15:55:55.403841-03	f	\N	f	t	\N	\N	none	1
26812	ALMACEN GELATINA EXQUISITA FRUTILLA		7790070413024	0.00	0.00	0.000	12	/uploads/7790070413024.jpg	2026-01-12 15:55:55.407722-03	2026-01-12 15:55:55.407722-03	f	\N	f	t	\N	\N	none	1
26828	ALMACEN HARINA MORIXE 000		7790199000013	633.60	900.00	0.000	21	/uploads/7790199000013.jpg	2026-01-12 15:55:55.460098-03	2026-01-17 11:39:22.705788-03	f	\N	f	t	\N	\N	none	1
26829	ALMACEN HARINA PUREZA 0000		7792180004871	1020.80	1300.00	0.000	21	/uploads/7792180004871.jpg	2026-01-12 15:55:55.462712-03	2026-01-17 11:39:22.711778-03	f	\N	f	t	\N	\N	none	1
26830	ALMACEN HARINA PUREZA LEUDANTE		7792180004888	1140.70	1450.00	13.000	21	/uploads/7792180004888.jpg	2026-01-12 15:55:55.465344-03	2026-01-17 11:39:22.717874-03	f	\N	f	t	\N	\N	none	1
26832	ALMACEN HILERET CLASICOX 250ML		7794940000819	1186.90	1850.00	-1.000	21	/uploads/7794940000819.jpg	2026-01-12 15:55:55.471392-03	2026-01-17 11:39:22.728059-03	f	\N	f	t	\N	\N	none	1
26833	ALMACEN HILERET STEVIA X200		7794940000796	2981.00	3800.00	7.000	21	/uploads/7794940000796.jpg	2026-01-12 15:55:55.474135-03	2026-01-17 11:39:22.733022-03	f	\N	f	t	\N	\N	none	1
26834	ALMACEN HILERET SWEET X 200ML		7790490998200	1498.20	2000.00	14.000	21	/uploads/7790490998200.jpg	2026-01-12 15:55:55.477053-03	2026-01-17 11:39:22.738564-03	f	\N	f	t	\N	\N	none	1
26835	ALMACEN HILERET ZUCRA		7794940000857	0.00	0.00	0.000	21	/uploads/7794940000857.jpg	2026-01-12 15:55:55.479758-03	2026-01-17 11:39:22.743807-03	f	\N	f	t	\N	\N	none	1
26836	ALMACEN HILERET. MATE		7790490998002	0.00	0.00	0.000	21	/uploads/7790490998002.jpg	2026-01-12 15:55:55.482419-03	2026-01-17 11:39:22.750212-03	f	\N	f	t	\N	\N	none	1
26838	ALMACEN HUEVO X MAPLE. $5.800		186543268	227.70	300.00	-926.600	\N	/uploads/186543268.jpg	2026-01-12 15:55:55.488229-03	2026-01-17 11:39:22.761954-03	f	\N	f	t	\N	\N	none	1
26839	ALMACEN JAMON CRUDO X100G	\N	JJJJJJJJJ	15187.70	22000.00	1.260	21	\N	2026-01-12 15:55:55.490919-03	2026-01-17 11:39:22.76699-03	f	\N	f	t	\N	\N	none	1
26841	ALMACEN JUGO SOBRE TANG 20		JUGO TANG	398.20	500.00	-16.000	21	/uploads/JUGO TANG.jpg	2026-01-12 15:55:55.496829-03	2026-01-17 11:39:22.777296-03	f	\N	f	t	\N	\N	none	1
26842	ALMACEN JUGOS RINDE 2		JUGOS EN SOBRES	462.00	700.00	42.000	21	/uploads/JUGOS EN SOBRES.jpg	2026-01-12 15:55:55.500028-03	2026-01-17 11:39:22.782523-03	f	\N	f	t	\N	\N	none	1
26844	ALMACEN KETCHU HELLMANN'S X 250G		7794000003606	1124.20	1500.00	-2.000	21	/uploads/7794000003606.jpg	2026-01-12 15:55:55.507017-03	2026-01-17 11:39:22.792814-03	f	\N	f	t	\N	\N	none	1
26845	ALMACEN KETCHU HELLMANNS X 60GS		5793114461762	446.60	650.00	-7.000	21	/uploads/5793114461762.jpg	2026-01-12 15:55:55.510515-03	2026-01-17 11:39:22.798087-03	f	\N	f	t	\N	\N	none	1
26846	ALMACEN KETCHUP NATURA		7791866000381	0.00	0.00	0.000	21	/uploads/7791866000381.jpg	2026-01-12 15:55:55.513917-03	2026-01-17 11:39:22.803444-03	f	\N	f	t	\N	\N	none	1
26847	ALMACEN LENTEJON.		7795499000503	1146.20	1550.00	-6.000	21	/uploads/7795499000503.jpg	2026-01-12 15:55:55.517182-03	2026-01-17 11:39:22.809047-03	f	\N	f	t	\N	\N	none	1
26849	ALMACEN LEVADURA EN POLVO X2		7798018850184	722.70	1000.00	19.000	21	/uploads/7798018850184.jpg	2026-01-12 15:55:55.522594-03	2026-01-17 11:39:22.819445-03	f	\N	f	t	\N	\N	none	1
26851	ALMACEN MAIZ PISINGALLO  MONEDA X 400G		7795499000534	0.00	0.00	0.000	21	/uploads/7795499000534.jpg	2026-01-12 15:55:55.528445-03	2026-01-17 11:39:22.830542-03	f	\N	f	t	\N	\N	none	1
26852	ALMACEN MAIZ PISINGALLO LISSETA X 400G		7798032180632	0.00	0.00	0.000	21	/uploads/7798032180632.jpg	2026-01-12 15:55:55.531357-03	2026-01-17 11:39:22.837651-03	f	\N	f	t	\N	\N	none	1
26853	ALMACEN MAIZENA X 200		7794000599178	1706.10	2200.00	5.000	21	/uploads/7794000599178.jpg	2026-01-12 15:55:55.535168-03	2026-01-17 11:39:22.844078-03	f	\N	f	t	\N	\N	none	1
26855	ALMACEN MANI CROCANTE CERVECERO		125789	5810.20	8000.00	-2.440	21	/uploads/125789.jpg	2026-01-12 15:55:55.542545-03	2026-01-17 11:39:22.855944-03	f	\N	f	t	\N	\N	none	1
26856	ALMACEN MANI PELADO		MANI PELADO	6127.00	8500.00	0.370	21	/uploads/MANI PELADO.jpg	2026-01-12 15:55:55.545436-03	2026-01-17 11:39:22.861706-03	f	\N	f	t	\N	\N	none	1
26857	ALMACEN MARGARINA DANICA		7791620009803	1650.00	2000.00	-2.000	21	/uploads/7791620009803.jpg	2026-01-12 15:55:55.548618-03	2026-01-17 11:39:22.868161-03	f	\N	f	t	\N	\N	none	1
26858	ALMACEN MATE COCIDO  UNION		7790387010589	0.00	0.00	-1.000	21	/uploads/7790387010589.jpg	2026-01-12 15:55:55.552596-03	2026-01-17 11:39:22.87545-03	f	\N	f	t	\N	\N	none	1
26859	ALMACEN MATE COCIDO TARAGUI		7790387800050	1101.10	1400.00	7.000	21	/uploads/7790387800050.jpg	2026-01-12 15:55:55.556383-03	2026-01-17 11:39:22.881475-03	f	\N	f	t	\N	\N	none	1
26861	ALMACEN MAYONESA HELLMANNS X 250		7794000004825	944.90	1700.00	5.000	21	/uploads/7794000004825.jpg	2026-01-12 15:55:55.565547-03	2026-01-17 11:39:22.891508-03	f	\N	f	t	\N	\N	none	1
26862	ALMACEN MAYONESA NATURA X 125CM3		7791866082288	603.90	850.00	-3.000	21	/uploads/7791866082288.jpg	2026-01-12 15:55:55.570328-03	2026-01-17 11:39:22.896301-03	f	\N	f	t	\N	\N	none	1
26863	ALMACEN MAYONESA NATURA X 1KG		7791866001357	0.00	0.00	0.000	21	/uploads/7791866001357.jpg	2026-01-12 15:55:55.574474-03	2026-01-17 11:39:22.90165-03	f	\N	f	t	\N	\N	none	1
26864	ALMACEN MAYONESA NATURA X250		7791866001203	1328.80	1800.00	-11.000	21	/uploads/7791866001203.jpg	2026-01-12 15:55:55.577748-03	2026-01-17 11:39:22.906771-03	f	\N	f	t	\N	\N	none	1
26866	ALMACEN MERMELADA  NOEL  NARAJA		7795184119770	1659.90	2100.00	24.000	21	/uploads/7795184119770.jpg	2026-01-12 15:55:55.58579-03	2026-01-17 11:39:22.922143-03	f	\N	f	t	\N	\N	none	1
26868	ALMACEN MERMELADA FRUTILLA LIGHT		7795184006308	1815.00	2250.00	0.000	21	/uploads/7795184006308.jpg	2026-01-12 15:55:55.592406-03	2026-01-17 11:39:22.927548-03	f	\N	f	t	\N	\N	none	1
26869	ALMACEN MERMELADA LIGHT DURAZNO		7795184006001	1659.90	2100.00	1.000	21	/uploads/7795184006001.jpg	2026-01-12 15:55:55.597055-03	2026-01-17 11:39:22.932887-03	f	\N	f	t	\N	\N	none	1
26872	ALMACEN MIEL DE EXPORTACION		7795557000018	0.00	0.00	0.000	21	/uploads/7795557000018.jpg	2026-01-12 15:55:55.610589-03	2026-01-17 11:39:22.944166-03	f	\N	f	t	\N	\N	none	1
26873	ALMACEN MIEL PURA BOTELLA		012345	2354.00	3000.00	5.000	21	/uploads/012345.jpg	2026-01-12 15:55:55.614561-03	2026-01-17 11:39:22.949861-03	f	\N	f	t	\N	\N	none	1
26874	ALMACEN MINERVA		7790070507341	1998.70	2500.00	2.000	21	/uploads/7790070507341.jpg	2026-01-12 15:55:55.619498-03	2026-01-17 11:39:22.955936-03	f	\N	f	t	\N	\N	none	1
26875	ALMACEN MINERVA X250		7790070507372	1294.70	1700.00	2.000	21	/uploads/7790070507372.jpg	2026-01-12 15:55:55.624035-03	2026-01-17 11:39:22.968595-03	f	\N	f	t	\N	\N	none	1
26877	ALMACEN MORENITA  TE HIERBAS NATURALES		7790170926622	550.00	1000.00	-1.000	21	/uploads/7790170926622.jpg	2026-01-12 15:55:55.634121-03	2026-01-17 11:39:22.986157-03	f	\N	f	t	\N	\N	none	1
26878	ALMACEN MORENITA TE BOLDO		7790170924642	1038.40	1350.00	5.000	21	/uploads/7790170924642.jpg	2026-01-12 15:55:55.638987-03	2026-01-17 11:39:22.991673-03	f	\N	f	t	\N	\N	none	1
26879	ALMACEN TE MANZANILLA MORENITA		7790170929647	878.90	1200.00	3.000	21	/uploads/7790170929647.jpg	2026-01-12 15:55:55.644213-03	2026-01-17 11:39:22.99671-03	f	\N	f	t	\N	\N	none	1
26880	ALMACEN MOSTAZA NATURA X 250		7791866004211	789.80	1200.00	15.000	21	/uploads/7791866004211.jpg	2026-01-12 15:55:55.648568-03	2026-01-17 11:39:23.003483-03	f	\N	f	t	\N	\N	none	1
26882	ALMACEN NESQUIK X180		7613034450074	1515.80	2100.00	3.000	21	/uploads/7613034450074.jpg	2026-01-12 15:55:55.654695-03	2026-01-17 11:39:23.01658-03	f	\N	f	t	\N	\N	none	1
26883	ALMACEN NUEZ MOSCADA EN GRANO		7790150536285	1646.70	2000.00	4.000	21	/uploads/7790150536285.jpg	2026-01-12 15:55:55.657648-03	2026-01-17 11:39:23.023093-03	f	\N	f	t	\N	\N	none	1
26867	ALMACEN MERMELADA DE DURAZNO NOEL		7795184119756	1210.00	6412.50	0.000	21	/uploads/7795184119756.jpg	2026-01-12 15:55:55.588694-03	2026-01-12 15:55:55.588694-03	f	\N	f	t	\N	\N	none	1
26884	ALMACEN PA DULCE		PANDUL135566	0.00	0.00	0.000	21	/uploads/PANDUL135566.jpg	2026-01-12 15:55:55.661145-03	2026-01-17 11:39:23.02849-03	f	\N	f	t	\N	\N	none	1
26886	ALMACEN PALMITOS TROSADOS		7791885000096	165.00	6612.00	-1.000	21	/uploads/7791885000096.jpg	2026-01-12 15:55:55.667877-03	2026-01-17 11:39:23.039541-03	f	\N	f	t	\N	\N	none	1
26870	ALMACEN MERMELADA NOEL LINGH		7795184006100	1365.00	7087.50	0.000	21	/uploads/7795184006100.jpg	2026-01-12 15:55:55.603379-03	2026-01-12 15:55:55.603379-03	f	\N	f	t	\N	\N	none	1
26887	ALMACEN PALMITOS X 400G		7791885000805	3791.70	4700.00	1.000	21	/uploads/7791885000805.jpg	2026-01-12 15:55:55.670726-03	2026-01-17 11:39:23.045303-03	f	\N	f	t	\N	\N	none	1
26888	ALMACEN PAN DE PANCHO ROMERO		7796854000121	1144.00	1500.00	16.000	21	/uploads/7796854000121.jpg	2026-01-12 15:55:55.673462-03	2026-01-17 11:39:23.051294-03	f	\N	f	t	\N	\N	none	1
26889	ALMACEN PAN DE  PATY		7796854000114	1144.00	1500.00	-13.000	21	/uploads/7796854000114.jpg	2026-01-12 15:55:55.676388-03	2026-01-17 11:39:23.05681-03	f	\N	f	t	\N	\N	none	1
26891	ALMACEN PAN DULCE BENJAMIN X 400GS		7790907000014	2116.40	2700.00	1.000	21	/uploads/7790907000014.jpg	2026-01-12 15:55:55.684155-03	2026-01-17 11:39:23.069513-03	f	\N	f	t	\N	\N	none	1
26892	ALMACEN PAN DULCE BENJAMIN X 700GS		7790907000106	1959.10	2500.00	2.000	21	/uploads/7790907000106.jpg	2026-01-12 15:55:55.689502-03	2026-01-17 11:39:23.075357-03	f	\N	f	t	\N	\N	none	1
26893	ALMACEN PAN DULCE ORALI		7791218122945	0.00	0.00	0.000	21	/uploads/7791218122945.jpg	2026-01-12 15:55:55.694601-03	2026-01-17 11:39:23.085074-03	f	\N	f	t	\N	\N	none	1
26894	ALMACEN PAN LACTAL CHICO		7796854000145	1724.80	2200.00	-19.000	21	/uploads/7796854000145.jpg	2026-01-12 15:55:55.699011-03	2026-01-17 11:39:23.092033-03	f	\N	f	t	\N	\N	none	1
26895	ALMACEN PAN LACTAL GRANDE		7796854000152	2278.10	3100.00	-11.000	21	/uploads/7796854000152.jpg	2026-01-12 15:55:55.702716-03	2026-01-17 11:39:23.100531-03	f	\N	f	t	\N	\N	none	1
26897	ALMACEN PAN RALLADO MAMA COCINA		7792180004741	864.60	1200.00	15.000	21	/uploads/7792180004741.jpg	2026-01-12 15:55:55.7528-03	2026-01-17 11:39:23.120696-03	f	\N	f	t	\N	\N	none	1
26898	ALMACEN PAN RALLADO PREFERIDO		7790070411488	1247.40	1600.00	21.000	21	/uploads/7790070411488.jpg	2026-01-12 15:55:55.760956-03	2026-01-17 11:39:23.126919-03	f	\N	f	t	\N	\N	none	1
26899	ALMACEN PAN RALLADO SEQUITO		7791422000060	308.00	450.00	-52.910	21	/uploads/7791422000060.jpg	2026-01-12 15:55:55.764654-03	2026-01-17 11:39:23.134715-03	f	\N	f	t	\N	\N	none	1
26901	ALMACEN PAPAS FRITBON		7798006433221	0.00	0.00	0.000	21	/uploads/7798006433221.jpg	2026-01-12 15:55:55.771223-03	2026-01-17 11:39:23.146225-03	f	\N	f	t	\N	\N	none	1
26902	CONGELADOS PAPASMACEIN. X 1/4 $850		CONGELADOSSS	4796.00	7000.00	6.950	17	/uploads/CONGELADOSSS.jpg	2026-01-12 15:55:55.774029-03	2026-01-17 11:39:23.15211-03	f	\N	f	t	\N	\N	none	1
26903	ALMACEN PATE		7790360720382	820.60	1000.00	5.000	21	/uploads/7790360720382.jpg	2026-01-12 15:55:55.777029-03	2026-01-17 11:39:23.158203-03	f	\N	f	t	\N	\N	none	1
26904	ALMACEN PEPAS CHOCOTRIO X 300GS		7791787001153	1298.00	1600.00	0.000	21	/uploads/7791787001153.jpg	2026-01-12 15:55:55.779895-03	2026-01-17 11:39:23.164811-03	f	\N	f	t	\N	\N	none	1
26905	ALMACEN PICADILLO		7790360720115	820.60	1000.00	10.000	21	/uploads/7790360720115.jpg	2026-01-12 15:55:55.783082-03	2026-01-17 11:39:23.170196-03	f	\N	f	t	\N	\N	none	1
26907	ALMACEN PIONONO ORALI		7791218123737	2178.00	2800.00	5.000	21	/uploads/7791218123737.jpg	2026-01-12 15:55:55.791021-03	2026-01-17 11:39:23.182835-03	f	\N	f	t	\N	\N	none	1
26908	ALMACEN PIPAS		77965233	0.00	0.00	0.000	21	/uploads/77965233.jpg	2026-01-12 15:55:55.795761-03	2026-01-17 11:39:23.189227-03	f	\N	f	t	\N	\N	none	1
26911	ALMACEN POLENTA PRESTOPRONTA		7790580660000	990.00	1350.00	-7.000	21	/uploads/7790580660000.jpg	2026-01-12 15:55:55.80532-03	2026-01-17 11:39:23.224981-03	f	\N	f	t	\N	\N	none	1
26912	ALMACEN POLVO PARA HORNEAR		7798137921222	575.30	900.00	12.000	21	/uploads/7798137921222.jpg	2026-01-12 15:55:55.808135-03	2026-01-17 11:39:23.237718-03	f	\N	f	t	\N	\N	none	1
26913	ALMACEN POROTOS LISETA ALUBIA		7798032180038	0.00	0.00	-1.000	21	/uploads/7798032180038.jpg	2026-01-12 15:55:55.81148-03	2026-01-17 11:39:23.243936-03	f	\N	f	t	\N	\N	none	1
26915	ALMACEN PURE DE PAPAS KNORR		7794000004139	1873.30	2400.00	13.000	21	/uploads/7794000004139.jpg	2026-01-12 15:55:55.819414-03	2026-01-17 11:39:23.260094-03	f	\N	f	t	\N	\N	none	1
26916	ALMACEN PURE DE PAPAS MAGGI		8445290060907	1916.20	2400.00	-11.000	\N	/uploads/8445290060907.jpg	2026-01-12 15:55:55.823764-03	2026-01-17 11:39:23.266828-03	f	\N	f	t	\N	\N	none	1
26917	ALMACEN PURE DE TOMATE LA HUERTA X 530		7790036567440	842.60	1100.00	15.000	21	/uploads/7790036567440.jpg	2026-01-12 15:55:55.827776-03	2026-01-17 11:39:23.272597-03	f	\N	f	t	\N	\N	none	1
26918	ALMACEN PURE DE TOMATE LA HUERTA X210		7790036973036	475.20	650.00	15.000	21	/uploads/7790036973036.jpg	2026-01-12 15:55:55.832062-03	2026-01-17 11:39:23.283031-03	f	\N	f	t	\N	\N	none	1
26919	ALMACEN PURE DE TOMATE MOLTO		7798138554603	862.40	1000.00	17.000	21	/uploads/7798138554603.jpg	2026-01-12 15:55:55.836591-03	2026-01-17 11:39:23.288535-03	f	\N	f	t	\N	\N	none	1
26920	ALMACEN PURE TOMATE NOEL		7795184001907	0.00	0.00	0.000	21	/uploads/7795184001907.jpg	2026-01-12 15:55:55.839684-03	2026-01-17 11:39:23.293943-03	f	\N	f	t	\N	\N	none	1
26922	ALMACEN QUESO CLASICO ORIGINAL LA SERENISIMA X 290G		7791337005457	1665.40	2000.00	1.000	21	/uploads/7791337005457.jpg	2026-01-12 15:55:55.845215-03	2026-01-17 11:39:23.309485-03	f	\N	f	t	\N	\N	none	1
26923	ALMACEN QUESO RALLADO LA SERENISIMA		7790742222909	1146.20	1500.00	2.000	21	/uploads/7790742222909.jpg	2026-01-12 15:55:55.848279-03	2026-01-17 11:39:23.318922-03	f	\N	f	t	\N	\N	none	1
26924	ALMACEN RAVANA CACAO		7790971000385	0.00	0.00	0.000	21	/uploads/7790971000385.jpg	2026-01-12 15:55:55.85112-03	2026-01-17 11:39:23.323653-03	f	\N	f	t	\N	\N	none	1
26925	ALMACEN RAVIOLES CARNE Y ESPINACA. Y FIDEOS ORALI		7791218000281	1727.00	2300.00	4.000	21	/uploads/7791218000281.jpg	2026-01-12 15:55:55.854001-03	2026-01-17 11:39:23.33413-03	f	\N	f	t	\N	\N	none	1
26926	ALMACEN REBOZADOR FREIR		7792180004765	0.00	0.00	0.000	21	/uploads/7792180004765.jpg	2026-01-12 15:55:55.856978-03	2026-01-17 11:39:23.339205-03	f	\N	f	t	\N	\N	none	1
26928	ALMACEN SAL GRUESA		7791004000099	1552.10	1980.00	-1.000	21	/uploads/7791004000099.jpg	2026-01-12 15:55:55.864368-03	2026-01-17 11:39:23.356827-03	f	\N	f	t	\N	\N	none	1
26929	ALMACEN SAL PARRILLERA		7791004000051	1685.20	2100.00	-1.000	21	/uploads/7791004000051.jpg	2026-01-12 15:55:55.867277-03	2026-01-17 11:39:23.367561-03	f	\N	f	t	\N	\N	none	1
26930	ALMACEN SALADIX DUO		7790040374706	608.30	800.00	15.000	21	/uploads/7790040374706.jpg	2026-01-12 15:55:55.870075-03	2026-01-17 11:39:23.37435-03	f	\N	f	t	\N	\N	none	1
26932	ALMACEN CHIMICHURRI TIPO CASERO		7798116163025	0.00	0.00	0.000	21	/uploads/7798116163025.jpg	2026-01-12 15:55:55.875419-03	2026-01-17 11:39:23.389566-03	f	\N	f	t	\N	\N	none	1
26933	ALMACEN SALSA BLANCA ALICANTE		7790150580424	1124.20	1350.00	0.000	21	/uploads/7790150580424.jpg	2026-01-12 15:55:55.878163-03	2026-01-17 11:39:23.397917-03	f	\N	f	t	\N	\N	none	1
26934	ALMACEN SALSA DE SOJA		7798116163032	0.00	0.00	0.000	21	/uploads/7798116163032.jpg	2026-01-12 15:55:55.880715-03	2026-01-17 11:39:23.406073-03	f	\N	f	t	\N	\N	none	1
26935	ALMACEN SALSA GOLF DANICA		7791620187327	1124.20	2200.00	5.000	21	/uploads/7791620187327.jpg	2026-01-12 15:55:55.883359-03	2026-01-17 11:39:23.415225-03	f	\N	f	t	\N	\N	none	1
26937	ALMACEN SALSA PIZZA INCA		7798144510181	0.00	0.00	0.000	21	/uploads/7798144510181.jpg	2026-01-12 15:55:55.889264-03	2026-01-17 11:39:23.428452-03	f	\N	f	t	\N	\N	none	1
26938	ALMACEN SARDINA CUMANA		7791885000515	1419.00	1750.00	-3.000	21	/uploads/7791885000515.jpg	2026-01-12 15:55:55.893294-03	2026-01-17 11:39:23.432888-03	f	\N	f	t	\N	\N	none	1
26939	ALMACEN SAVORA X 250		7794000005006	789.80	1200.00	0.000	21	/uploads/7794000005006.jpg	2026-01-12 15:55:55.896283-03	2026-01-17 11:39:23.438048-03	f	\N	f	t	\N	\N	none	1
26940	ALMACEN SAVORAORIGINAL X60G		7794000005013	592.90	750.00	-5.000	21	/uploads/7794000005013.jpg	2026-01-12 15:55:55.899005-03	2026-01-17 11:39:23.443138-03	f	\N	f	t	\N	\N	none	1
26943	ALMACEN SOPA DE ARVEJAS CON JAMON		7794000004313	1875.50	2350.00	9.000	21	/uploads/7794000004313.jpg	2026-01-12 15:55:55.908587-03	2026-01-17 11:39:23.453657-03	f	\N	f	t	\N	\N	none	1
26944	ALMACEN SUSTITUTO CARNICO MAGIA CARNE		7791218000731	1941.50	2000.00	2.000	21	/uploads/7791218000731.jpg	2026-01-12 15:55:55.913314-03	2026-01-17 11:39:23.45954-03	f	\N	f	t	\N	\N	none	1
26945	ALMACEN TAPA EMPANADA DELICIA DORADA		7798105510144	0.00	0.00	0.000	21	/uploads/7798105510144.jpg	2026-01-12 15:55:55.918567-03	2026-01-17 11:39:23.465205-03	f	\N	f	t	\N	\N	none	1
26947	ALMACEN TE CHAI		7790150250501	0.00	0.00	0.000	21	/uploads/7790150250501.jpg	2026-01-12 15:55:55.929898-03	2026-01-17 11:39:23.475076-03	f	\N	f	t	\N	\N	none	1
26948	ALMACEN TE DE BOLDO TARAGUI		7790387000290	49.50	285.00	6.000	21	/uploads/7790387000290.jpg	2026-01-12 15:55:55.933652-03	2026-01-17 11:39:23.480891-03	f	\N	f	t	\N	\N	none	1
26949	ALMACEN TE DE BOLDO VIRGINIA		7790150310267	0.00	0.00	0.000	21	/uploads/7790150310267.jpg	2026-01-12 15:55:55.937594-03	2026-01-17 11:39:23.486093-03	f	\N	f	t	\N	\N	none	1
26950	ALMACEN TE DE CEDRON		7790150350171	1284.80	1650.00	0.000	21	/uploads/7790150350171.jpg	2026-01-12 15:55:55.941337-03	2026-01-17 11:39:23.49175-03	f	\N	f	t	\N	\N	none	1
26951	ALMACEN TE LIMON Y MIEL		7790387013344	143.00	188.10	3.000	21	/uploads/7790387013344.jpg	2026-01-12 15:55:55.944336-03	2026-01-17 11:39:23.496927-03	f	\N	f	t	\N	\N	none	1
26953	ALMACEN TE MENTA Y PEPERINA		7790150340165	92.51	205.20	3.000	21	/uploads/7790150340165.jpg	2026-01-12 15:55:55.94983-03	2026-01-17 11:39:23.507608-03	f	\N	f	t	\N	\N	none	1
26954	ALMACEN TE TARAGÜI X 25 SAQUITOS		7790387800135	902.00	1200.00	3.000	21	/uploads/7790387800135.jpg	2026-01-12 15:55:55.95292-03	2026-01-17 11:39:23.511925-03	f	\N	f	t	\N	\N	none	1
26955	ALMACEN TE TILO TARAGUI		7790387000306	88.00	285.00	1.000	21	/uploads/7790387000306.jpg	2026-01-12 15:55:55.955638-03	2026-01-17 11:39:23.516485-03	f	\N	f	t	\N	\N	none	1
26956	ALMACEN TE VERDE TARAGÜI		7790387001785	1628.00	2000.00	0.000	21	/uploads/7790387001785.jpg	2026-01-12 15:55:55.958377-03	2026-01-17 11:39:23.521845-03	f	\N	f	t	\N	\N	none	1
26958	ALMACEN TILO CON MANZANA Y CEDRON		7790150321065	165.00	199.50	1.000	21	/uploads/7790150321065.jpg	2026-01-12 15:55:55.965133-03	2026-01-17 11:39:23.533518-03	f	\N	f	t	\N	\N	none	1
26941	ALMACEN SI DIET X500		7790036020204	1516.00	7087.50	-5.000	21	/uploads/7790036020204.jpg	2026-01-12 15:55:55.901551-03	2026-01-12 15:55:55.901551-03	f	\N	f	t	\N	\N	none	1
26959	ALMACEN TOSTADAS DE ARROZ LEIVA		7790412000271	0.00	0.00	0.000	21	/uploads/7790412000271.jpg	2026-01-12 15:55:55.968353-03	2026-01-17 11:39:23.538315-03	f	\N	f	t	\N	\N	none	1
26960	ALMACEN TOMATE  PERITA CUMANA		7791885003639	935.00	1200.00	-7.000	21	/uploads/7791885003639.jpg	2026-01-12 15:55:55.971142-03	2026-01-17 11:39:23.543059-03	f	\N	f	t	\N	\N	none	1
26961	ALMACEN TOMATE MORA X 520		7798106150011	555.50	750.00	0.000	21	/uploads/7798106150011.jpg	2026-01-12 15:55:55.973739-03	2026-01-17 11:39:23.549506-03	f	\N	f	t	\N	\N	none	1
26963	ALMACEN TOMATE PERITA  MOLTO		7791579069323	811.80	1100.00	0.000	21	/uploads/7791579069323.jpg	2026-01-12 15:55:55.978802-03	2026-01-17 11:39:23.561861-03	f	\N	f	t	\N	\N	none	1
26964	ALMACEN TOMATE PERITA MORA		7798106150165	697.40	1000.00	-1.000	21	/uploads/7798106150165.jpg	2026-01-12 15:55:55.98148-03	2026-01-17 11:39:23.56647-03	f	\N	f	t	\N	\N	none	1
26965	ALMACEN TOMATE TRITURADO CUMANA X 980G		7791885004919	0.00	0.00	0.000	21	/uploads/7791885004919.jpg	2026-01-12 15:55:55.985356-03	2026-01-17 11:39:23.571794-03	f	\N	f	t	\N	\N	none	1
26967	ALMACEN TOMATE X 1 LITRO		7790036007816	0.00	0.00	6.000	21	/uploads/7790036007816.jpg	2026-01-12 15:55:55.992366-03	2026-01-17 11:39:23.581725-03	f	\N	f	t	\N	\N	none	1
26970	ALMACEN TOSTADAS GLUTEN SUELTAS		2136	0.00	0.00	0.000	21	/uploads/2136.jpg	2026-01-12 15:55:56.001581-03	2026-01-17 11:39:23.597274-03	f	\N	f	t	\N	\N	none	1
26971	ALMACEN TUTUCAS $12.000		TUTUTU	385.00	600.00	-113.000	21	/uploads/TUTUTU.jpg	2026-01-12 15:55:56.004199-03	2026-01-17 11:39:23.6033-03	f	\N	f	t	\N	\N	none	1
26972	ALMACEN TWISTOS JAMON		7790310984451	1406.90	2200.00	0.000	21	/uploads/7790310984451.jpg	2026-01-12 15:55:56.006963-03	2026-01-17 11:39:23.608798-03	f	\N	f	t	\N	\N	none	1
26973	ALMACEN VAINILLAS PAR NOR		7791324157541	108.90	148.20	6.000	21	/uploads/7791324157541.jpg	2026-01-12 15:55:56.009784-03	2026-01-17 11:39:23.614117-03	f	\N	f	t	\N	\N	none	1
26974	ALMACEN VAINILLIN		7798158711505	0.00	0.00	12.000	21	/uploads/7798158711505.jpg	2026-01-12 15:55:56.012458-03	2026-01-17 11:39:23.619638-03	f	\N	f	t	\N	\N	none	1
26976	ALMACEN VINAGRE X500		2797378000944	556.60	700.00	0.000	21	/uploads/2797378000944.jpg	2026-01-12 15:55:56.020196-03	2026-01-17 11:39:23.630249-03	f	\N	f	t	\N	\N	none	1
26977	ALMACEN YERBA AMANDA		7792710000182	1511.40	2200.00	4.000	21	/uploads/7792710000182.jpg	2026-01-12 15:55:56.023933-03	2026-01-17 11:39:23.635518-03	f	\N	f	t	\N	\N	none	1
26978	ALMACEN YERBA CBS COMUN X 500G		7790710000102	1483.90	2000.00	10.000	21	/uploads/7790710000102.jpg	2026-01-12 15:55:56.02754-03	2026-01-17 11:39:23.641433-03	f	\N	f	t	\N	\N	none	1
26979	ALMACEN YERBA CBS GUARANA X 500G		7790710334603	1574.10	2200.00	5.000	21	/uploads/7790710334603.jpg	2026-01-12 15:55:56.031774-03	2026-01-17 11:39:23.647262-03	f	\N	f	t	\N	\N	none	1
26981	ALMACEN YERBA LA CUMBRECITA		7790217000032	572.00	1800.00	-3.000	21	/uploads/7790217000032.jpg	2026-01-12 15:55:56.039535-03	2026-01-17 11:39:23.657464-03	f	\N	f	t	\N	\N	none	1
26982	ALMACEN YERBA LA HOJA		7791680101257	916.30	1600.00	9.000	21	/uploads/7791680101257.jpg	2026-01-12 15:55:56.043771-03	2026-01-17 11:39:23.662889-03	f	\N	f	t	\N	\N	none	1
26983	ALMACEN YERBA MAÑANITA X 500G	Compré ofert 468	7790387015324	2010.80	2500.00	11.000	21	/uploads/7790387015324.jpg	2026-01-12 15:55:56.046951-03	2026-01-17 11:39:23.668025-03	f	\N	f	t	\N	\N	none	1
26984	ALMACEN YERBA NATURA		7792198006621	0.00	0.00	10.000	21	/uploads/7792198006621.jpg	2026-01-12 15:55:56.049611-03	2026-01-17 11:39:23.673928-03	f	\N	f	t	\N	\N	none	1
26986	ALMACEN YERBA PLAYADITO X 500G		7793704000911	1947.00	2600.00	3.000	21	/uploads/7793704000911.jpg	2026-01-12 15:55:56.054494-03	2026-01-17 11:39:23.684996-03	f	\N	f	t	\N	\N	none	1
26987	ALMACEN YERBA ROSAMONTE		7790411001507	308.00	1850.00	4.000	21	/uploads/7790411001507.jpg	2026-01-12 15:55:56.057132-03	2026-01-17 11:39:23.690306-03	f	\N	f	t	\N	\N	none	1
26988	ALMACEN YERBA TARAGUI		7790387013627	1926.10	2200.00	10.000	21	/uploads/7790387013627.jpg	2026-01-12 15:55:56.061374-03	2026-01-17 11:39:23.695515-03	f	\N	f	t	\N	\N	none	1
26989	ALMACEN YERBA TRANQUERA		7790480089734	214.50	319.20	4.000	21	/uploads/7790480089734.jpg	2026-01-12 15:55:56.064811-03	2026-01-17 11:39:23.700318-03	f	\N	f	t	\N	\N	none	1
26991	ALMACEN ÑOQUIS ORALI		7791218000137	1884.30	2400.00	4.000	21	/uploads/7791218000137.jpg	2026-01-12 15:55:56.071712-03	2026-01-17 11:39:23.711104-03	f	\N	f	t	\N	\N	none	1
26992	ART VARIOS ALFILETES RUEDA		1111222333	330.00	500.00	2.000	39	/uploads/1111222333.jpg	2026-01-12 15:55:56.074507-03	2026-01-17 11:39:23.716021-03	f	\N	f	t	\N	\N	none	1
26993	ART VARIOS CINTA AISLADORA DE PVC SCOTCH		7792840002315	3850.00	4000.00	-3.000	39	/uploads/7792840002315.jpg	2026-01-12 15:55:56.078246-03	2026-01-17 11:39:23.72067-03	f	\N	f	t	\N	\N	none	1
26995	ART VARIOS ENCENDEDORES CANDEL		6902004095218	279.40	400.00	5.000	39	/uploads/6902004095218.jpg	2026-01-12 15:55:56.088536-03	2026-01-17 11:39:23.726601-03	f	\N	f	t	\N	\N	none	1
26996	FARMACIA ART VARIOS GASA ESTERIL  PRESIO X UNIDAD		7798013319617	206.80	350.00	-15.000	30	/uploads/7798013319617.jpg	2026-01-12 15:55:56.093096-03	2026-01-17 11:39:23.732863-03	f	\N	f	t	\N	\N	none	1
26997	ART VARIOS HILOS PARA COSER		HILOS	275.00	600.00	11.000	39	/uploads/HILOS.jpg	2026-01-12 15:55:56.098097-03	2026-01-17 11:39:23.738902-03	f	\N	f	t	\N	\N	none	1
26999	ART VARIOS NAIPES CASINO X50		7797216001046	1540.00	2500.00	-8.000	39	/uploads/7797216001046.jpg	2026-01-12 15:55:56.108172-03	2026-01-17 11:39:23.744105-03	f	\N	f	t	\N	\N	none	1
27000	ART VARIOS NAIPES HACHAZO		7792783000515	1020.80	1280.00	3.000	39	/uploads/7792783000515.jpg	2026-01-12 15:55:56.112874-03	2026-01-17 11:39:23.749171-03	f	\N	f	t	\N	\N	none	1
27001	ART VARIOS PEGAMENTO ECOLE		7790400030457	4389.00	5500.00	4.000	39	/uploads/7790400030457.jpg	2026-01-12 15:55:56.117553-03	2026-01-17 11:39:23.754586-03	f	\N	f	t	\N	\N	none	1
27002	ART VARIOS PILAS A23		7896009700743	825.00	1000.00	2.000	39	/uploads/7896009700743.jpg	2026-01-12 15:55:56.122154-03	2026-01-17 11:39:23.761245-03	f	\N	f	t	\N	\N	none	1
27004	ART VARIOS PILAS DURACELL DOBLE AA X 1		041333666860	0.00	0.00	3.000	39	/uploads/041333666860.jpg	2026-01-12 15:55:56.129684-03	2026-01-17 11:39:23.771091-03	f	\N	f	t	\N	\N	none	1
27005	ART VARIOS PILAS DURACELL TRIPLE AAA X 2		041333428482	0.00	0.00	3.000	39	/uploads/041333428482.jpg	2026-01-12 15:55:56.133448-03	2026-01-17 11:39:23.776103-03	f	\N	f	t	\N	\N	none	1
27006	ART VARIOS POXI		POXIPOLLLLL	1353.00	1824.00	6.000	39	/uploads/POXIPOLLLLL.jpg	2026-01-12 15:55:56.137242-03	2026-01-17 11:39:23.780958-03	f	\N	f	t	\N	\N	none	1
27007	ART VARIOS SET DE AGUJAS		AGUJAS	49.50	57.00	11.000	39	/uploads/AGUJAS.jpg	2026-01-12 15:55:56.14084-03	2026-01-17 11:39:23.786343-03	f	\N	f	t	\N	\N	none	1
27008	ART VARIOS VELONES CUMPLE		145896	49.50	91.20	40.000	39	/uploads/145896.jpg	2026-01-12 15:55:56.144299-03	2026-01-17 11:39:23.791529-03	f	\N	f	t	\N	\N	none	1
26994	ART VARIOS CINTA AISLADORA SCOTCH		7792840003169	250.00	5062.50	1.000	39	/uploads/7792840003169.jpg	2026-01-12 15:55:56.083832-03	2026-01-12 15:55:56.083832-03	f	\N	f	t	\N	\N	none	1
27010	ART.LIMPIEZA AEROSOL AYUDIN		7793253005078	222.20	319.20	3.000	29	/uploads/7793253005078.jpg	2026-01-12 15:55:56.153256-03	2026-01-17 11:39:23.80375-03	f	\N	f	t	\N	\N	none	1
27013	PIEZA ART.LIM ALCOHOL PUROCOL X 500		7792378001682	1641.20	2200.00	3.000	29	/uploads/7792378001682.jpg	2026-01-12 15:55:56.16659-03	2026-01-17 11:39:23.808825-03	f	\N	f	t	\N	\N	none	1
27016	ART.LIMPIEZA ART.LIMP..RAID AEROSOL MOSCAS MOSQUITO		7790520017420	5060.00	6500.00	5.000	22	/uploads/7790520017420.jpg	2026-01-12 15:55:56.178187-03	2026-01-17 11:39:23.831617-03	f	\N	f	t	\N	\N	none	1
27017	ART.LIMPIEZA AYUDIN ROPA  QUITAMACHAS		7793253002336	91.30	125.40	3.000	29	/uploads/7793253002336.jpg	2026-01-12 15:55:56.181244-03	2026-01-17 11:39:23.837097-03	f	\N	f	t	\N	\N	none	1
27018	ART.LIMPIEZA BLEM NARANJA		7790463000091	4926.90	6000.00	1.000	29	/uploads/7790463000091.jpg	2026-01-12 15:55:56.185168-03	2026-01-17 11:39:23.842201-03	f	\N	f	t	\N	\N	none	1
27020	ART.LIMPIEZA BOLSAS CONSORCIO BRESSBOL 60X90		788750390038	1061.50	1500.00	-3.000	29	/uploads/788750390038.jpg	2026-01-12 15:55:56.194804-03	2026-01-17 11:39:23.853428-03	f	\N	f	t	\N	\N	none	1
27021	ART.LIMPIEZA BOLSAS RESIDUOS BRESSBOL 45X60		7798158390014	543.40	800.00	1.000	29	/uploads/7798158390014.jpg	2026-01-12 15:55:56.198089-03	2026-01-17 11:39:23.858368-03	f	\N	f	t	\N	\N	none	1
27022	ART.LIMPIEZA BOLSAS SUPER CONSORCIO BRESSBOL 75X100		7798158390052	2250.60	2900.00	4.000	29	/uploads/7798158390052.jpg	2026-01-12 15:55:56.200735-03	2026-01-17 11:39:23.86384-03	f	\N	f	t	\N	\N	none	1
27023	ART.LIMPIEZA BROCHES ROMYL		7798061890397	0.00	0.00	1.000	29	/uploads/7798061890397.jpg	2026-01-12 15:55:56.203221-03	2026-01-17 11:39:23.870137-03	f	\N	f	t	\N	\N	none	1
27024	ART.LIMPIEZA BROCHES SED METAL		5794160012151	1283.70	1600.00	-6.000	29	/uploads/5794160012151.jpg	2026-01-12 15:55:56.205806-03	2026-01-17 11:39:23.875691-03	f	\N	f	t	\N	\N	none	1
27011	ART.LIMPIEZA AGUA OXIGENADA 30		7794050007258	611.00	2868.75	8.000	29	/uploads/7794050007258.jpg	2026-01-12 15:55:56.158233-03	2026-01-12 15:55:56.158233-03	f	\N	f	t	\N	\N	none	1
27012	ART.LIMPIEZA ALA EN POLVO MATIC		7791290011700	980.00	4050.00	7.000	29	/uploads/7791290011700.jpg	2026-01-12 15:55:56.161913-03	2026-01-12 15:55:56.161913-03	f	\N	f	t	\N	\N	none	1
27015	ART.LIMPIEZA DETERGENTE  ALA ..750ML		7791290012394	875.00	4893.75	3.000	29	/uploads/7791290012394.jpg	2026-01-12 15:55:56.175154-03	2026-01-12 15:55:56.175154-03	f	\N	f	t	\N	\N	none	1
27027	ART.LIMPIEZA CIF CREMA ..375ML		7791290790490	1485.00	2100.00	9.000	22	/uploads/7791290790490.jpg	2026-01-12 15:55:56.215069-03	2026-01-17 11:39:23.89168-03	f	\N	f	t	\N	\N	none	1
27029	ART.LIMPIEZA CIF VIDRIOS		7791290007505	0.00	0.00	0.000	22	/uploads/7791290007505.jpg	2026-01-12 15:55:56.22018-03	2026-01-17 11:39:23.903508-03	f	\N	f	t	\N	\N	none	1
27030	ART.LIMPIEZA CIF VIDRIOS X 450ML		7791290789944	0.00	0.00	0.000	29	/uploads/7791290789944.jpg	2026-01-12 15:55:56.222652-03	2026-01-17 11:39:23.908923-03	f	\N	f	t	\N	\N	none	1
27031	ART.LIMPIEZA CONFORT		7791290010444	330.00	387.60	3.000	29	/uploads/7791290010444.jpg	2026-01-12 15:55:56.225213-03	2026-01-17 11:39:23.914192-03	f	\N	f	t	\N	\N	none	1
27032	ART.LIMPIEZA CONSORCIO		BOLSAS ECONOMICAS	220.00	296.40	3.000	29	/uploads/BOLSAS ECONOMICAS.jpg	2026-01-12 15:55:56.227961-03	2026-01-17 11:39:23.919441-03	f	\N	f	t	\N	\N	none	1
27034	ART.LIMPIEZA DESODORANTE PISO POET		7793253003456	1375.00	2250.00	32.000	29	/uploads/7793253003456.jpg	2026-01-12 15:55:56.233712-03	2026-01-17 11:39:23.931282-03	f	\N	f	t	\N	\N	none	1
27035	PIEZA ART.LIM DETERGENTE MAGISTRAL 300ML		7500435170543	1925.00	2950.00	19.000	22	/uploads/7500435170543.jpg	2026-01-12 15:55:56.236464-03	2026-01-17 11:39:23.937643-03	f	\N	f	t	\N	\N	none	1
27036	ART.LIMPIEZA DETERGENTE  CIF 300ML		7791290012226	1541.10	2000.00	-4.000	22	/uploads/7791290012226.jpg	2026-01-12 15:55:56.239029-03	2026-01-17 11:39:23.942607-03	f	\N	f	t	\N	\N	none	1
27037	ART.LIMPIEZA DISPENCER DE AEROSOL AUTOMATICO		7798184682060	1067.00	1824.00	1.000	29	/uploads/7798184682060.jpg	2026-01-12 15:55:56.242688-03	2026-01-17 11:39:23.948918-03	f	\N	f	t	\N	\N	none	1
27038	ART.LIMPIEZA ECHO EN EL BALDE		7790520995667	317.90	424.08	3.000	29	/uploads/7790520995667.jpg	2026-01-12 15:55:56.246681-03	2026-01-17 11:39:23.953964-03	f	\N	f	t	\N	\N	none	1
27040	PIEZA ART.LIM ESPIRAL FUYI X 4		7790520010490	0.00	0.00	0.000	29	/uploads/7790520010490.jpg	2026-01-12 15:55:56.253748-03	2026-01-17 11:39:24.059645-03	f	\N	f	t	\N	\N	none	1
27041	ART.LIMPIEZA ESPIRALES X12 FUYI		7790520009548	0.00	0.00	0.000	29	/uploads/7790520009548.jpg	2026-01-12 15:55:56.256634-03	2026-01-17 11:39:24.083894-03	f	\N	f	t	\N	\N	none	1
27042	ART.LIMPIEZA FRANELA 40X45		7790927813243	1325.50	1650.00	-5.000	29	/uploads/7790927813243.jpg	2026-01-12 15:55:56.260471-03	2026-01-17 11:39:24.097918-03	f	\N	f	t	\N	\N	none	1
27043	ART.LIMPIEZA FUYI AEROSOL		7790520005816	4758.60	5900.00	10.000	22	/uploads/7790520005816.jpg	2026-01-12 15:55:56.266613-03	2026-01-17 11:39:24.103701-03	f	\N	f	t	\N	\N	none	1
27045	ART.LIMPIEZA HARPIC POWER PLUS		7791130681421	3245.00	3900.00	5.000	29	/uploads/7791130681421.jpg	2026-01-12 15:55:56.311886-03	2026-01-17 11:39:24.119569-03	f	\N	f	t	\N	\N	none	1
27046	ART.LIMPIEZA HISOPO ALGABO		7791274005237	1815.00	2200.00	-1.000	29	/uploads/7791274005237.jpg	2026-01-12 15:55:56.314908-03	2026-01-17 11:39:24.126487-03	f	\N	f	t	\N	\N	none	1
27047	PIEZA ART.LIM JABON ALA EN PAN X 200		7791290010734	1291.40	1600.00	-2.000	29	/uploads/7791290010734.jpg	2026-01-12 15:55:56.318097-03	2026-01-17 11:39:24.132645-03	f	\N	f	t	\N	\N	none	1
27050	ART.LIMPIEZA JABON EN PAN SEISEME		7796311000022	1835.90	2300.00	4.000	29	/uploads/7796311000022.jpg	2026-01-12 15:55:56.326838-03	2026-01-17 11:39:24.161582-03	f	\N	f	t	\N	\N	none	1
27051	ART.LIMPIEZA JABON EN PAN ZORRO		7790990000489	44.00	100.32	3.000	29	/uploads/7790990000489.jpg	2026-01-12 15:55:56.329927-03	2026-01-17 11:39:24.166507-03	f	\N	f	t	\N	\N	none	1
27052	ART.LIMPIEZA JABON FEDERAL		7790990000465	88.00	111.72	3.000	29	/uploads/7790990000465.jpg	2026-01-12 15:55:56.332787-03	2026-01-17 11:39:24.173591-03	f	\N	f	t	\N	\N	none	1
27053	ART.LIMPIEZA JABON LIQUIDO ACE DE 400ML		7500435176675	121.00	136.80	1.000	29	/uploads/7500435176675.jpg	2026-01-12 15:55:56.335951-03	2026-01-17 11:39:24.181932-03	f	\N	f	t	\N	\N	none	1
27055	PIEZA ART.LIM  QUERUBIN JABON LIQUIDO  X 800		7791905001393	1980.00	3000.00	3.000	29	/uploads/7791905001393.jpg	2026-01-12 15:55:56.341817-03	2026-01-17 11:39:24.192472-03	f	\N	f	t	\N	\N	none	1
27056	ART.LIMPIEZA JABON LIQUIDO SKIP X 400		7791290788497	115.50	245.10	3.000	29	/uploads/7791290788497.jpg	2026-01-12 15:55:56.34442-03	2026-01-17 11:39:24.198252-03	f	\N	f	t	\N	\N	none	1
27057	ART.LIMPIEZA JABON LIQUIDO SKIP X 800		7791290790889	247.50	340.86	3.000	29	/uploads/7791290790889.jpg	2026-01-12 15:55:56.347065-03	2026-01-17 11:39:24.203465-03	f	\N	f	t	\N	\N	none	1
27058	ART.LIMPIEZA JABON POLVO LAVADO A MANO		7791290011755	99.00	547.20	80.000	29	/uploads/7791290011755.jpg	2026-01-12 15:55:56.349648-03	2026-01-17 11:39:24.20881-03	f	\N	f	t	\N	\N	none	1
27059	ART.LIMPIEZA JABON TOCADOR LIMOL X 3		7790990586969	95.70	147.06	4.000	29	/uploads/7790990586969.jpg	2026-01-12 15:55:56.352381-03	2026-01-17 11:39:24.216689-03	f	\N	f	t	\N	\N	none	1
27061	ART.LIMPIEZA JABON ZORRO		7790990572429	0.00	0.00	3.000	29	/uploads/7790990572429.jpg	2026-01-12 15:55:56.359097-03	2026-01-17 11:39:24.229937-03	f	\N	f	t	\N	\N	none	1
27062	ART.LIMPIEZA LA GOTITA GEL		77906731	1980.00	2500.00	4.000	29	/uploads/77906731.jpg	2026-01-12 15:55:56.361909-03	2026-01-17 11:39:24.236255-03	f	\N	f	t	\N	\N	none	1
27063	ART.LIMPIEZA LAVANDINA AYUDIN COMUN X 1LTS		7793253004439	1034.00	1600.00	22.000	29	/uploads/7793253004439.jpg	2026-01-12 15:55:56.364503-03	2026-01-17 11:39:24.241238-03	f	\N	f	t	\N	\N	none	1
27048	ART.LIMPIEZA JABON ALA LIQUIDO X800		7791290790964	1971.00	9450.00	3.000	29	/uploads/7791290790964.jpg	2026-01-12 15:55:56.321585-03	2026-01-12 15:55:56.321585-03	f	\N	f	t	\N	\N	none	1
27066	ART.LIMPIEZA LAVANDINA QUITAMANCHAS		7793253004774	1848.00	2300.00	4.000	29	/uploads/7793253004774.jpg	2026-01-12 15:55:56.372659-03	2026-01-17 11:39:24.262234-03	f	\N	f	t	\N	\N	none	1
27067	ART.LIMPIEZA LAVANDINA ROPA BLANCA QUERUBIN		7791905003663	91.30	125.40	3.000	29	/uploads/7791905003663.jpg	2026-01-12 15:55:56.375341-03	2026-01-17 11:39:24.268351-03	f	\N	f	t	\N	\N	none	1
27068	ART.LIMPIEZA LAVANDINA X2LITROS		7793253004446	1980.00	2500.00	5.000	29	/uploads/7793253004446.jpg	2026-01-12 15:55:56.377886-03	2026-01-17 11:39:24.273953-03	f	\N	f	t	\N	\N	none	1
27069	ART.LIMPIEZA LISOFORM		7790520014177	2689.50	3500.00	9.000	29	/uploads/7790520014177.jpg	2026-01-12 15:55:56.380503-03	2026-01-17 11:39:24.278932-03	f	\N	f	t	\N	\N	none	1
27071	ART.LIMPIEZA MECHUDO		LAMPAZO22222	1969.00	2500.00	1.000	29	/uploads/LAMPAZO22222.jpg	2026-01-12 15:55:56.387716-03	2026-01-17 11:39:24.289092-03	f	\N	f	t	\N	\N	none	1
27072	ART.LIMPIEZA MR MUSCULO ANTIGRASA		7790520998880	2805.00	3500.00	0.000	29	/uploads/7790520998880.jpg	2026-01-12 15:55:56.390283-03	2026-01-17 11:39:24.294244-03	f	\N	f	t	\N	\N	none	1
27073	ART.LIMPIEZA MR MUSCULO BAÑO		7790520012395	2640.00	3300.00	2.000	22	/uploads/7790520012395.jpg	2026-01-12 15:55:56.392822-03	2026-01-17 11:39:24.299511-03	f	\N	f	t	\N	\N	none	1
27074	ART.LIMPIEZA MR MUSCULO VIDRIOS		7790520018618	2640.00	3300.00	2.000	29	/uploads/7790520018618.jpg	2026-01-12 15:55:56.395419-03	2026-01-17 11:39:24.304385-03	f	\N	f	t	\N	\N	none	1
27075	ART.LIMPIEZA ODEX		7791905004486	12.10	111.72	1.000	22	/uploads/7791905004486.jpg	2026-01-12 15:55:56.397917-03	2026-01-17 11:39:24.309177-03	f	\N	f	t	\N	\N	none	1
27077	ART.LIMPIEZA PALO DE ESCOBA		1111122	964.70	1300.00	-1.000	29	/uploads/1111122.jpg	2026-01-12 15:55:56.405762-03	2026-01-17 11:39:24.319482-03	f	\N	f	t	\N	\N	none	1
27078	ART.LIMPIEZA PANTENE		7500435012324	968.00	1356.60	3.000	29	/uploads/7500435012324.jpg	2026-01-12 15:55:56.409729-03	2026-01-17 11:39:24.32453-03	f	\N	f	t	\N	\N	none	1
27079	ART.LIMPIEZA PAPEL COCINA ELEGANTE		7793344904013	1360.70	1800.00	6.000	29	/uploads/7793344904013.jpg	2026-01-12 15:55:56.413297-03	2026-01-17 11:39:24.329453-03	f	\N	f	t	\N	\N	none	1
27064	ART.LIMPIEZA LAVANDINA EN GEL AYUDIN		7793253003791	202.00	1000.35	2.000	29	/uploads/7793253003791.jpg	2026-01-12 15:55:56.367211-03	2026-01-12 15:55:56.367211-03	f	\N	f	t	\N	\N	none	1
27080	PIEZA ART.LIM PASTILLAS FUYI X TABLETA DE 4		7790520010049	198.00	400.00	-22.000	29	/uploads/7790520010049.jpg	2026-01-12 15:55:56.418781-03	2026-01-17 11:39:24.334493-03	f	\N	f	t	\N	\N	none	1
27082	ART.LIMPIEZA PEGAMENTO PAWER GLUE		7798014060716	22.00	79.80	8.000	29	/uploads/7798014060716.jpg	2026-01-12 15:55:56.425422-03	2026-01-17 11:39:24.345035-03	f	\N	f	t	\N	\N	none	1
27085	PIEZA ART.LIM POLVO PEDICO EFICIENT  X100		7791293040950	2200.00	2800.00	6.000	29	/uploads/7791293040950.jpg	2026-01-12 15:55:56.435201-03	2026-01-17 11:39:24.361738-03	f	\N	f	t	\N	\N	none	1
27086	ART.LIMPIEZA POMADA PARA CALZADO (BETUM)		7793350102304	2547.60	3500.00	11.000	29	/uploads/7793350102304.jpg	2026-01-12 15:55:56.438672-03	2026-01-17 11:39:24.369408-03	f	\N	f	t	\N	\N	none	1
27087	PIEZA ART.LIM PRESTOBARBA 2FILOS		7501009222729	926.20	1500.00	-2.000	29	/uploads/7501009222729.jpg	2026-01-12 15:55:56.441517-03	2026-01-17 11:39:24.374295-03	f	\N	f	t	\N	\N	none	1
27088	PIEZA ART.LIM PRESTOBARBA 3FILOS  GILLETTE		7506339337532	2152.70	2800.00	-15.000	29	/uploads/7506339337532.jpg	2026-01-12 15:55:56.444343-03	2026-01-17 11:39:24.380276-03	f	\N	f	t	\N	\N	none	1
27089	ART.LIMPIEZA PRESTOBARBA VENUS		7500435184595	2387.00	2950.00	-40.000	29	/uploads/7500435184595.jpg	2026-01-12 15:55:56.447254-03	2026-01-17 11:39:24.386439-03	f	\N	f	t	\N	\N	none	1
27107	BEBIDA ANAN FIZZ DL VALLE		16161627272	510.00	1885.27	5.000	19	\N	2026-01-12 15:55:56.507563-03	2026-01-12 15:55:56.507563-03	f	\N	f	t	\N	\N	none	1
27091	ART.LIMPIEZA RAID JARDIN		7790520991836	0.00	0.00	0.000	22	/uploads/7790520991836.jpg	2026-01-12 15:55:56.45235-03	2026-01-17 11:39:24.396758-03	f	\N	f	t	\N	\N	none	1
27092	ART.LIMPIEZA REJILLA DOBL REFORZADA MEDIA NARANJA		7798136921698	1136.30	1500.00	8.000	29	/uploads/7798136921698.jpg	2026-01-12 15:55:56.454791-03	2026-01-17 11:39:24.402377-03	f	\N	f	t	\N	\N	none	1
27093	PIEZA ART.LIM REJILLA COMUN		7790528005009	330.00	600.00	115.000	29	/uploads/7790528005009.jpg	2026-01-12 15:55:56.457421-03	2026-01-17 11:39:24.407732-03	f	\N	f	t	\N	\N	none	1
27094	PIEZA ART.LIM REJILLA LAVA COCHE		7790927816039	0.00	0.00	1.000	29	/uploads/7790927816039.jpg	2026-01-12 15:55:56.461966-03	2026-01-17 11:39:24.412916-03	f	\N	f	t	\N	\N	none	1
27096	ART.LIMPIEZA REPASADOR  ROMYL		7798061892216	1059.30	1350.00	1.000	29	/uploads/7798061892216.jpg	2026-01-12 15:55:56.46807-03	2026-01-17 11:39:24.423355-03	f	\N	f	t	\N	\N	none	1
27968	ALMACEN TOMATE ARCOR		7790580567101	852.50	1050.00	5.000	21	/uploads/7790580567101.jpg	2026-01-12 15:55:59.805596-03	2026-01-17 11:39:27.68283-03	f	\N	f	t	\N	\N	none	1
27097	ART.LIMPIEZA RESIDUOS 45X60		BOLSAS ECONOMICASSS	40.70	57.00	3.000	29	/uploads/BOLSAS ECONOMICASSS.jpg	2026-01-12 15:55:56.470632-03	2026-01-17 11:39:24.428603-03	f	\N	f	t	\N	\N	none	1
27098	ART.LIMPIEZA RESIDUOS 60X90		7798158390038	202.40	273.60	3.000	29	/uploads/7798158390038.jpg	2026-01-12 15:55:56.473091-03	2026-01-17 11:39:24.433724-03	f	\N	f	t	\N	\N	none	1
27099	ART.LIMPIEZA REJILLA PARA COCHE LIVIANA		7792387000294	1900.80	2350.00	1.000	29	/uploads/7792387000294.jpg	2026-01-12 15:55:56.475788-03	2026-01-17 11:39:24.438901-03	f	\N	f	t	\N	\N	none	1
27100	ART.LIMPIEZA SECADORES PISO		1111	660.00	1500.00	11.000	29	/uploads/1111.jpg	2026-01-12 15:55:56.478603-03	2026-01-17 11:39:24.443822-03	f	\N	f	t	\N	\N	none	1
27102	PIEZA ART.LIM QUERUBIN SUAVIZANTE		7791905002598	2697.20	3400.00	14.000	29	/uploads/7791905002598.jpg	2026-01-12 15:55:56.484806-03	2026-01-17 11:39:24.451815-03	f	\N	f	t	\N	\N	none	1
27103	ART.LIMPIEZA TABLETAS RAID X UNIDAD		7790520995360	190.30	400.00	151.000	29	/uploads/7790520995360.jpg	2026-01-12 15:55:56.488497-03	2026-01-17 11:39:24.455846-03	f	\N	f	t	\N	\N	none	1
27104	PIEZA ART.LIM TRAPO DE PISO GRANDE		7790927812901	0.00	0.00	0.000	29	/uploads/7790927812901.jpg	2026-01-12 15:55:56.493305-03	2026-01-17 11:39:24.459872-03	f	\N	f	t	\N	\N	none	1
27105	ART.LIMPIEZA VELAS VIRGENCITA		7791533840067	2337.50	2900.00	25.000	29	/uploads/7791533840067.jpg	2026-01-12 15:55:56.498081-03	2026-01-17 11:39:24.463645-03	f	\N	f	t	\N	\N	none	1
27106	ART.LIMPIEZA VIRULANA		7794440001729	683.10	1000.00	3.000	29	/uploads/7794440001729.jpg	2026-01-12 15:55:56.502777-03	2026-01-17 11:39:24.468472-03	f	\N	f	t	\N	\N	none	1
27109	BEBIDA FIESTA SIDRA SIN ALCOHOL		7798054012867	147.40	199.50	6.000	49	/uploads/7798054012867.jpg	2026-01-12 15:55:56.515747-03	2026-01-17 11:39:24.477851-03	f	\N	f	t	\N	\N	none	1
27110	BEBIDA GATORADE X 500 ML		7792170042005	1600.50	2200.00	10.000	44	/uploads/7792170042005.jpg	2026-01-12 15:55:56.519434-03	2026-01-17 11:39:24.482727-03	f	\N	f	t	\N	\N	none	1
27111	BEBIDA GATORADE X1 1/4		7792170110575	3009.60	3700.00	4.000	44	/uploads/7792170110575.jpg	2026-01-12 15:55:56.523147-03	2026-01-17 11:39:24.487268-03	f	\N	f	t	\N	\N	none	1
27112	BEBIDA TERMA		7790950133318	2079.00	2600.00	7.000	37	/uploads/7790950133318.jpg	2026-01-12 15:55:56.526771-03	2026-01-17 11:39:24.491188-03	f	\N	f	t	\N	\N	none	1
27114	BODEGA ALARIS MALBEC		7790240017045	341.00	467.40	6.000	12	/uploads/7790240017045.jpg	2026-01-12 15:55:56.534286-03	2026-01-17 11:39:24.499505-03	f	\N	f	t	\N	\N	none	1
27115	BODEGA ANANA FIZZ REAL		7790119009942	2846.80	3600.00	0.000	24	/uploads/7790119009942.jpg	2026-01-12 15:55:56.538188-03	2026-01-17 11:39:24.503837-03	f	\N	f	t	\N	\N	none	1
27116	BODEGA WISKEY WHITE HORSE CABALLO BLANCO		7791250001253	15687.10	18000.00	1.000	24	/uploads/7791250001253.jpg	2026-01-12 15:55:56.541989-03	2026-01-17 11:39:24.508773-03	f	\N	f	t	\N	\N	none	1
27117	BODEGA AP.CAÑA OMBU		7792410505390	280.50	2000.00	1.000	24	/uploads/7792410505390.jpg	2026-01-12 15:55:56.545578-03	2026-01-17 11:39:24.513377-03	f	\N	f	t	\N	\N	none	1
27119	BODEGA AP.FRIZZE		7791540042706	0.00	0.00	6.000	24	/uploads/7791540042706.jpg	2026-01-12 15:55:56.554735-03	2026-01-17 11:39:24.521286-03	f	\N	f	t	\N	\N	none	1
27120	BODEGA AP.GANCIA		7790950000160	6316.20	7800.00	25.000	24	/uploads/7790950000160.jpg	2026-01-12 15:55:56.560149-03	2026-01-17 11:39:24.525278-03	f	\N	f	t	\N	\N	none	1
27121	BODEGA AP.MANON		7790121000043	196.90	215.46	1.000	24	/uploads/7790121000043.jpg	2026-01-12 15:55:56.565217-03	2026-01-17 11:39:24.530042-03	f	\N	f	t	\N	\N	none	1
27122	BODEGA AP.MARTINI		7790950134810	418.00	444.60	1.000	24	/uploads/7790950134810.jpg	2026-01-12 15:55:56.572076-03	2026-01-17 11:39:24.534864-03	f	\N	f	t	\N	\N	none	1
27124	BODEGA VODKA AP.SMIRNOFF		7791250002243	7588.90	9300.00	-1.000	24	/uploads/7791250002243.jpg	2026-01-12 15:55:56.584855-03	2026-01-17 11:39:24.54371-03	f	\N	f	t	\N	\N	none	1
27125	BODEGA BUDWEISER		7792798003624	0.00	0.00	0.000	36	/uploads/7792798003624.jpg	2026-01-12 15:55:56.589686-03	2026-01-17 11:39:24.54791-03	f	\N	f	t	\N	\N	none	1
27126	BODEGA CAFE AL COÑAC		77908377	154.00	165.30	1.000	24	/uploads/77908377.jpg	2026-01-12 15:55:56.594906-03	2026-01-17 11:39:24.551787-03	f	\N	f	t	\N	\N	none	1
27127	BODEGA CAMPARI		7891136052000	9502.90	11500.00	-1.000	24	/uploads/7891136052000.jpg	2026-01-12 15:55:56.599643-03	2026-01-17 11:39:24.556764-03	f	\N	f	t	\N	\N	none	1
27129	BODEGA CERV ANDES ROJA		7792798992317	132.00	285.00	6.000	47	/uploads/7792798992317.jpg	2026-01-12 15:55:56.60558-03	2026-01-17 11:39:24.566173-03	f	\N	f	t	\N	\N	none	1
27130	BODEGA CERV HEINEKE 710 LATON		7793147571283	0.00	0.00	0.000	47	/uploads/7793147571283.jpg	2026-01-12 15:55:56.609582-03	2026-01-17 11:39:24.570769-03	f	\N	f	t	\N	\N	none	1
27131	BODEGA CERV IMPERIAL ROJA		7793147572723	202.40	302.10	6.000	36	/uploads/7793147572723.jpg	2026-01-12 15:55:56.613367-03	2026-01-17 11:39:24.578114-03	f	\N	f	t	\N	\N	none	1
27132	BODEGA CERV SANTA FE		7793147570286	264.00	399.00	6.000	36	/uploads/7793147570286.jpg	2026-01-12 15:55:56.616138-03	2026-01-17 11:39:24.583357-03	f	\N	f	t	\N	\N	none	1
27134	BODEGA CERV. BRAMA		7792798007493	2860.00	3300.00	100.000	36	/uploads/7792798007493.jpg	2026-01-12 15:55:56.621321-03	2026-01-17 11:39:24.596309-03	f	\N	f	t	\N	\N	none	1
27135	BODEGA CERV.BRAMA DORADA X710		7792798009756	0.00	0.00	1.000	36	/uploads/7792798009756.jpg	2026-01-12 15:55:56.624206-03	2026-01-17 11:39:24.601661-03	f	\N	f	t	\N	\N	none	1
27136	BODEGA CERV.GOLDEN IMPERIAL		7793147571672	2933.70	3600.00	1.000	36	/uploads/7793147571672.jpg	2026-01-12 15:55:56.626895-03	2026-01-17 11:39:24.606678-03	f	\N	f	t	\N	\N	none	1
27137	BODEGA CERV.PATAGONIA 730		7792798002399	220.00	453.72	18.000	36	/uploads/7792798002399.jpg	2026-01-12 15:55:56.629733-03	2026-01-17 11:39:24.611643-03	f	\N	f	t	\N	\N	none	1
27138	BODEGA CERV.QUILMES		7792798007387	2603.70	3100.00	-6.000	36	/uploads/7792798007387.jpg	2026-01-12 15:55:56.632313-03	2026-01-17 11:39:24.617242-03	f	\N	f	t	\N	\N	none	1
27140	BODEGA CERV.QUILMES NEGRA		7792798007400	2775.30	3300.00	21.000	36	/uploads/7792798007400.jpg	2026-01-12 15:55:56.637809-03	2026-01-17 11:39:24.632427-03	f	\N	f	t	\N	\N	none	1
27141	BODEGA CERV.STELLA DESCARTABLE X710 DESCARTABLE		7792798010127	0.00	0.00	-1.000	36	/uploads/7792798010127.jpg	2026-01-12 15:55:56.640392-03	2026-01-17 11:39:24.638025-03	f	\N	f	t	\N	\N	none	1
27143	BODEGA MILLERR		7793147570088	3043.70	3750.00	5.000	36	/uploads/7793147570088.jpg	2026-01-12 15:55:56.64762-03	2026-01-17 11:39:24.647767-03	f	\N	f	t	\N	\N	none	1
27144	BODEGA CORONA DESCARTABLE X710		7792798003716	3617.90	4600.00	24.000	36	/uploads/7792798003716.jpg	2026-01-12 15:55:56.652173-03	2026-01-17 11:39:24.651813-03	f	\N	f	t	\N	\N	none	1
27146	BODEGA CUSENIER CHOCOLATE		7792410008105	440.00	469.68	1.000	21	/uploads/7792410008105.jpg	2026-01-12 15:55:56.662458-03	2026-01-17 11:39:24.660293-03	f	\N	f	t	\N	\N	none	1
27147	BODEGA CUSENIER HUEVO		7792410008051	440.00	469.68	1.000	21	/uploads/7792410008051.jpg	2026-01-12 15:55:56.668734-03	2026-01-17 11:39:24.664319-03	f	\N	f	t	\N	\N	none	1
27148	BODEGA CUSENIER MELON		7792410008532	440.00	469.68	1.000	21	/uploads/7792410008532.jpg	2026-01-12 15:55:56.673711-03	2026-01-17 11:39:24.66902-03	f	\N	f	t	\N	\N	none	1
27149	BODEGA DADA #391 CABERNET		7791540047862	3858.80	4500.00	3.000	12	/uploads/7791540047862.jpg	2026-01-12 15:55:56.677286-03	2026-01-17 11:39:24.673629-03	f	\N	f	t	\N	\N	none	1
27153	BODEGA DR LEMON		7790950131918	3179.00	3900.00	4.000	24	/uploads/7790950131918.jpg	2026-01-12 15:55:56.695057-03	2026-01-17 11:39:24.683339-03	f	\N	f	t	\N	\N	none	1
27154	BODEGA DR.LEMON		7790950202823	1215.50	1490.00	0.000	37	/uploads/7790950202823.jpg	2026-01-12 15:55:56.699608-03	2026-01-17 11:39:24.688435-03	f	\N	f	t	\N	\N	none	1
27156	BODEGA ENERGY SPEED X 250		7798119220015	1287.00	1700.00	18.000	24	/uploads/7798119220015.jpg	2026-01-12 15:55:56.708209-03	2026-01-17 11:39:24.697279-03	f	\N	f	t	\N	\N	none	1
27157	BODEGA EUGENIO MALBE		7798141877362	638.00	741.00	6.000	12	/uploads/7798141877362.jpg	2026-01-12 15:55:56.712713-03	2026-01-17 11:39:24.702378-03	f	\N	f	t	\N	\N	none	1
27158	BODEGA SUTER CHAMPAGN		7790480008919	2563.00	4800.00	5.000	24	/uploads/7790480008919.jpg	2026-01-12 15:55:56.717108-03	2026-01-17 11:39:24.707861-03	f	\N	f	t	\N	\N	none	1
27160	BODEGA FERNET  BRANCA X 1 LT		7790290000523	0.00	0.00	0.000	24	/uploads/7790290000523.jpg	2026-01-12 15:55:56.726498-03	2026-01-17 11:39:24.718279-03	f	\N	f	t	\N	\N	none	1
27161	BODEGA FERNET X 450ML		7790290001179	9968.20	12000.00	11.000	24	/uploads/7790290001179.jpg	2026-01-12 15:55:56.730626-03	2026-01-17 11:39:24.723325-03	f	\N	f	t	\N	\N	none	1
27162	BODEGA FRIZZE BLU		7791540053184	2198.90	2750.00	4.000	24	/uploads/7791540053184.jpg	2026-01-12 15:55:56.734856-03	2026-01-17 11:39:24.728411-03	f	\N	f	t	\N	\N	none	1
27163	BODEGA GANCIA LIMA LIMON		7790950138627	2026.20	2600.00	17.000	47	/uploads/7790950138627.jpg	2026-01-12 15:55:56.739283-03	2026-01-17 11:39:24.733302-03	f	\N	f	t	\N	\N	none	1
27164	BODEGA GINEBRA BOLS		7791200004075	154.00	165.30	1.000	24	/uploads/7791200004075.jpg	2026-01-12 15:55:56.743823-03	2026-01-17 11:39:24.738381-03	f	\N	f	t	\N	\N	none	1
27166	BODEGA HEINEKEN 47E		16998805	2435.40	3100.00	18.000	36	/uploads/16998805.jpg	2026-01-12 15:55:56.752334-03	2026-01-17 11:39:24.748137-03	f	\N	f	t	\N	\N	none	1
27167	BODEGA IMPERIAL GOLDEN		7793147571689	0.00	0.00	0.000	37	/uploads/7793147571689.jpg	2026-01-12 15:55:56.756292-03	2026-01-17 11:39:24.752742-03	f	\N	f	t	\N	\N	none	1
27168	BODEGA IMPERIAL IPA		7793147570743	238.70	330.60	6.000	37	/uploads/7793147570743.jpg	2026-01-12 15:55:56.760975-03	2026-01-17 11:39:24.757468-03	f	\N	f	t	\N	\N	none	1
27151	BODEGA DR LEMON NARANJA		7790950136432	0.00	0.00	0.000	24	/uploads/7790950136432.jpg	2026-01-12 15:55:56.686373-03	2026-01-12 15:55:56.686373-03	f	\N	f	t	\N	\N	none	1
27152	BODEGA DR LEMON POMELO		7790950134896	0.00	0.00	0.000	24	/uploads/7790950134896.jpg	2026-01-12 15:55:56.690732-03	2026-01-12 15:55:56.690732-03	f	\N	f	t	\N	\N	none	1
27170	BODEGA CERV ANDES IPA		7792798002726	154.00	193.80	1.000	36	/uploads/7792798002726.jpg	2026-01-12 15:55:56.770828-03	2026-01-17 11:39:24.76627-03	f	\N	f	t	\N	\N	none	1
27171	BODEGA CERV ANDES NEGRA		7792798002320	154.00	193.80	1.000	36	/uploads/7792798002320.jpg	2026-01-12 15:55:56.774464-03	2026-01-17 11:39:24.770418-03	f	\N	f	t	\N	\N	none	1
27172	BODEGA CERV  ANDES RUVIA		7792798999866	154.00	296.40	1.000	36	/uploads/7792798999866.jpg	2026-01-12 15:55:56.778132-03	2026-01-17 11:39:24.775088-03	f	\N	f	t	\N	\N	none	1
27173	BODEGA CERV CORONA X269CM3		7792798008377	77.00	82.08	11.000	36	/uploads/7792798008377.jpg	2026-01-12 15:55:56.781613-03	2026-01-17 11:39:24.78006-03	f	\N	f	t	\N	\N	none	1
27175	BODEGA CERV IMPERIAL AMBER LAGER		7793147570774	159.50	273.60	1.000	36	/uploads/7793147570774.jpg	2026-01-12 15:55:56.790197-03	2026-01-17 11:39:24.788086-03	f	\N	f	t	\N	\N	none	1
27176	BODEGA CERV IMPERIAL IPA		7793147571160	159.50	171.00	1.000	36	/uploads/7793147571160.jpg	2026-01-12 15:55:56.794424-03	2026-01-17 11:39:24.792165-03	f	\N	f	t	\N	\N	none	1
27177	BODEGA CERV IMPERIAL STOUT		7793147001742	231.00	342.00	6.000	36	/uploads/7793147001742.jpg	2026-01-12 15:55:56.798269-03	2026-01-17 11:39:24.795996-03	f	\N	f	t	\N	\N	none	1
27178	BODEGA CERV STELLA		7792798010615	1287.00	1800.00	0.000	36	/uploads/7792798010615.jpg	2026-01-12 15:55:56.802039-03	2026-01-17 11:39:24.800152-03	f	\N	f	t	\N	\N	none	1
27180	BODEGA CERV .QUILMES		7792798012923	1252.90	1800.00	5.000	37	/uploads/7792798012923.jpg	2026-01-12 15:55:56.809518-03	2026-01-17 11:39:24.807979-03	f	\N	f	t	\N	\N	none	1
27181	BODEGA LOPEZ CABERNET		7790336030583	3190.00	4400.00	-2.000	12	/uploads/7790336030583.jpg	2026-01-12 15:55:56.813302-03	2026-01-17 11:39:24.811812-03	f	\N	f	t	\N	\N	none	1
27182	BODEGA MILLER		7793147001827	2020.70	2400.00	0.000	37	/uploads/7793147001827.jpg	2026-01-12 15:55:56.817736-03	2026-01-17 11:39:24.81566-03	f	\N	f	t	\N	\N	none	1
27183	BODEGA MONSTER ENERGI		1007084701235	2585.00	3200.00	4.000	47	/uploads/1007084701235.jpg	2026-01-12 15:55:56.822104-03	2026-01-17 11:39:24.819684-03	f	\N	f	t	\N	\N	none	1
27185	BODEGA PETACA CRIADORES		77975225	1837.00	2200.00	0.000	24	/uploads/77975225.jpg	2026-01-12 15:55:56.831519-03	2026-01-17 11:39:24.827456-03	f	\N	f	t	\N	\N	none	1
27186	BODEGA QUILMES STOUT		7792798001316	1611.50	1900.00	-2.000	37	/uploads/7792798001316.jpg	2026-01-12 15:55:56.836409-03	2026-01-17 11:39:24.831222-03	f	\N	f	t	\N	\N	none	1
27187	BODEGA CERV SCHNEIDER		7793147118860	990.00	1300.00	0.000	37	/uploads/7793147118860.jpg	2026-01-12 15:55:56.840989-03	2026-01-17 11:39:24.835043-03	f	\N	f	t	\N	\N	none	1
27188	BODEGA CERV SCHNEIDER ROJA		7793147571078	187.00	282.72	6.000	37	/uploads/7793147571078.jpg	2026-01-12 15:55:56.845943-03	2026-01-17 11:39:24.840353-03	f	\N	f	t	\N	\N	none	1
27190	BODEGA SPEED X 473		7798119220183	2127.40	2700.00	5.000	37	/uploads/7798119220183.jpg	2026-01-12 15:55:56.854195-03	2026-01-17 11:39:24.850805-03	f	\N	f	t	\N	\N	none	1
27191	BODEGA STELLA ARTOIS		7792798009312	0.00	0.00	0.000	37	/uploads/7792798009312.jpg	2026-01-12 15:55:56.85772-03	2026-01-17 11:39:24.855593-03	f	\N	f	t	\N	\N	none	1
27192	BODEGA TRES PLUMAS CHOCOLATE		77992246	154.00	165.30	1.000	24	/uploads/77992246.jpg	2026-01-12 15:55:56.86167-03	2026-01-17 11:39:24.861053-03	f	\N	f	t	\N	\N	none	1
27193	BODEGA TRES PLUMAS DUCE DE LECHE		77913692	154.00	165.30	1.000	24	/uploads/77913692.jpg	2026-01-12 15:55:56.865363-03	2026-01-17 11:39:24.865884-03	f	\N	f	t	\N	\N	none	1
27195	BODEGA VINO ALMA MORA SELECCION		7791540044106	0.00	0.00	0.000	12	/uploads/7791540044106.jpg	2026-01-12 15:55:56.872798-03	2026-01-17 11:39:24.877219-03	f	\N	f	t	\N	\N	none	1
27196	BODEGA VINO BENJAMIN MALBEC		7793440702940	330.00	370.50	1.000	12	/uploads/7793440702940.jpg	2026-01-12 15:55:56.876229-03	2026-01-17 11:39:24.883209-03	f	\N	f	t	\N	\N	none	1
27197	BODEGA VINO BRAVIO MALBEC		7794450004239	2860.00	4100.00	5.000	12	/uploads/7794450004239.jpg	2026-01-12 15:55:56.879805-03	2026-01-17 11:39:24.888192-03	f	\N	f	t	\N	\N	none	1
27198	BODEGA VINO CARCASONE		7790415105010	207.90	250.80	1.000	12	/uploads/7790415105010.jpg	2026-01-12 15:55:56.883579-03	2026-01-17 11:39:24.893073-03	f	\N	f	t	\N	\N	none	1
27200	BODEGA VINO COSECHA  ESPUMANTE		7792319000118	0.00	0.00	0.000	12	/uploads/7792319000118.jpg	2026-01-12 15:55:56.891695-03	2026-01-17 11:39:24.901687-03	f	\N	f	t	\N	\N	none	1
27201	BODEGA VINO COSECHA BLCO		7792319970404	4015.00	4950.00	6.000	12	/uploads/7792319970404.jpg	2026-01-12 15:55:56.896475-03	2026-01-17 11:39:24.90638-03	f	\N	f	t	\N	\N	none	1
27202	BODEGA VINO CUARA BLANCO		7791690713075	165.00	228.00	2.000	12	/uploads/7791690713075.jpg	2026-01-12 15:55:56.901333-03	2026-01-17 11:39:24.911251-03	f	\N	f	t	\N	\N	none	1
27205	BODEGA VINO DON VALENTIN MALBEC		7790703000478	3450.70	4500.00	2.000	12	/uploads/7790703000478.jpg	2026-01-12 15:55:56.915723-03	2026-01-17 11:39:24.924505-03	f	\N	f	t	\N	\N	none	1
27206	BODEGA VINO ESTIBA-1 MALBEC		7794450090959	3077.80	4000.00	2.000	12	/uploads/7794450090959.jpg	2026-01-12 15:55:56.920458-03	2026-01-17 11:39:24.929146-03	f	\N	f	t	\N	\N	none	1
27207	BODEGA VINO NOVECENTO		7790717152002	330.00	399.00	2.000	12	/uploads/7790717152002.jpg	2026-01-12 15:55:56.925148-03	2026-01-17 11:39:24.933238-03	f	\N	f	t	\N	\N	none	1
27208	BODEGA VINO NOVECENTO MALBEC ???........		779071715200200	0.00	2500.00	-1.000	12	/uploads/779071715200200.jpg	2026-01-12 15:55:56.930266-03	2026-01-17 11:39:24.937306-03	f	\N	f	t	\N	\N	none	1
27210	BODEGA VINO PORTILLO MALBEC		7798074860240	352.00	474.24	6.000	12	/uploads/7798074860240.jpg	2026-01-12 15:55:56.939788-03	2026-01-17 11:39:24.945307-03	f	\N	f	t	\N	\N	none	1
27211	BODEGA VINO QUARA		7791690709030	165.00	202.92	1.000	12	/uploads/7791690709030.jpg	2026-01-12 15:55:56.944493-03	2026-01-17 11:39:24.948926-03	f	\N	f	t	\N	\N	none	1
27212	BODEGA VINO RUTINI CABERNET MALBEC 2019		7790577001663	10890.00	14000.00	1.000	12	/uploads/7790577001663.jpg	2026-01-12 15:55:56.9488-03	2026-01-17 11:39:24.952762-03	f	\N	f	t	\N	\N	none	1
27213	BODEGA VINO SAN FELIPE		7790577039628	3297.80	4500.00	5.000	12	/uploads/7790577039628.jpg	2026-01-12 15:55:56.953214-03	2026-01-17 11:39:24.956513-03	f	\N	f	t	\N	\N	none	1
27215	BODEGA VINO SANTA FILOMENA GRANDE		7798008400665	2578.40	3200.00	7.000	12	/uploads/7798008400665.jpg	2026-01-12 15:55:56.961791-03	2026-01-17 11:39:24.964303-03	f	\N	f	t	\N	\N	none	1
27216	BODEGA VINO SUTER MALBEC		7790704167637	300.30	513.00	6.000	12	/uploads/7790704167637.jpg	2026-01-12 15:55:56.96615-03	2026-01-17 11:39:24.967871-03	f	\N	f	t	\N	\N	none	1
27217	BODEGA VINO TORO CLASICO X 1125LTS		7790314005305	0.00	0.00	0.000	12	/uploads/7790314005305.jpg	2026-01-12 15:55:56.973632-03	2026-01-17 11:39:24.971428-03	f	\N	f	t	\N	\N	none	1
27218	BODEGA VINO TORO		7790314003226	1531.20	1950.00	0.000	12	/uploads/7790314003226.jpg	2026-01-12 15:55:56.979371-03	2026-01-17 11:39:24.975584-03	f	\N	f	t	\N	\N	none	1
27219	BODEGA VINO TRUMPER RUTINI		7790577002165	6597.80	8100.00	9.000	12	/uploads/7790577002165.jpg	2026-01-12 15:55:56.983859-03	2026-01-17 11:39:24.97978-03	f	\N	f	t	\N	\N	none	1
27221	BODEGA VINO VIÑAS DE ALVEAR		7790480000463	256.30	396.72	3.000	37	/uploads/7790480000463.jpg	2026-01-12 15:55:56.992801-03	2026-01-17 11:39:24.989297-03	f	\N	f	t	\N	\N	none	1
27222	BODEGA VINOS ELEMENTOS		7790189021028	1786.40	2508.00	5.000	12	/uploads/7790189021028.jpg	2026-01-12 15:55:56.997006-03	2026-01-17 11:39:24.994147-03	f	\N	f	t	\N	\N	none	1
27223	BODEGA VIO TERMIDOR TINTO		7791540053351	1639.00	2200.00	12.000	12	/uploads/7791540053351.jpg	2026-01-12 15:55:57.001185-03	2026-01-17 11:39:24.99898-03	f	\N	f	t	\N	\N	none	1
27224	BODEGA VODCA NEW STILR		7798135763091	1248.50	2052.00	3.000	24	/uploads/7798135763091.jpg	2026-01-12 15:55:57.005486-03	2026-01-17 11:39:25.003904-03	f	\N	f	t	\N	\N	none	1
27226	CEREALES ARITOS FRUTALES		7790045826965	1122.00	1450.00	-8.000	40	/uploads/7790045826965.jpg	2026-01-12 15:55:57.013769-03	2026-01-17 11:39:25.013769-03	f	\N	f	t	\N	\N	none	1
27227	CHOCOLATES BANANITA FELFORT		7790206008407	429.00	650.00	27.000	32	/uploads/7790206008407.jpg	2026-01-12 15:55:57.017723-03	2026-01-17 11:39:25.018509-03	f	\N	f	t	\N	\N	none	1
27228	CHOCOLATES BAÑO DE REPOSTERIA AGUILA		7790580131487	2751.10	3400.00	0.000	32	/uploads/7790580131487.jpg	2026-01-12 15:55:57.021848-03	2026-01-17 11:39:25.024308-03	f	\N	f	t	\N	\N	none	1
27229	CHOCOLATES BLOCK X 38 G		7790580531201	1038.40	1400.00	13.000	18	/uploads/7790580531201.jpg	2026-01-12 15:55:57.025832-03	2026-01-17 11:39:25.028841-03	f	\N	f	t	\N	\N	none	1
27231	CHOCOLATES BOTELLITAS WISKY		7790206007363	66.00	77.52	11.000	18	/uploads/7790206007363.jpg	2026-01-12 15:55:57.034317-03	2026-01-17 11:39:25.035434-03	f	\N	f	t	\N	\N	none	1
27232	CHOCOLATES CFLER AIR MIXTO		7790580103385	77.00	88.92	1.000	18	/uploads/7790580103385.jpg	2026-01-12 15:55:57.039119-03	2026-01-17 11:39:25.039269-03	f	\N	f	t	\N	\N	none	1
27233	CHOCOLATES CHOC CARBURI INTENSO		7622210733887	88.00	108.30	10.000	32	/uploads/7622210733887.jpg	2026-01-12 15:55:57.043167-03	2026-01-17 11:39:25.04316-03	f	\N	f	t	\N	\N	none	1
27234	CHOCOLATES CHOCO BLOCK X170		7790580105013	4811.40	6000.00	1.000	32	/uploads/7790580105013.jpg	2026-01-12 15:55:57.047392-03	2026-01-17 11:39:25.046167-03	f	\N	f	t	\N	\N	none	1
27236	CHOCOLATES CHOCOLATE FEL FORT BARRITAS CADA UNA		7790206014309	2123.00	3420.00	5.000	18	/uploads/7790206014309.jpg	2026-01-12 15:55:57.055578-03	2026-01-17 11:39:25.051745-03	f	\N	f	t	\N	\N	none	1
27237	CHOCOLATES CHOCOLATE LICOR BOMBON FEL FORT		7790206009312	47.30	77.52	30.000	18	/uploads/7790206009312.jpg	2026-01-12 15:55:57.059862-03	2026-01-17 11:39:25.055187-03	f	\N	f	t	\N	\N	none	1
27238	CHOCOLATES CHOCOLATE SHOT X 35G		77914217	694.10	880.00	35.000	18	/uploads/77914217.jpg	2026-01-12 15:55:57.064521-03	2026-01-17 11:39:25.058895-03	f	\N	f	t	\N	\N	none	1
27239	CHOCOLATES CHOCOLATE TOKKE CON LECHE X 60G		7790380022114	88.00	100.32	1.000	18	/uploads/7790380022114.jpg	2026-01-12 15:55:57.069099-03	2026-01-17 11:39:25.063141-03	f	\N	f	t	\N	\N	none	1
27240	CHOCOLATES CHOCOLATE TOKKE CON LECHE Y MANI X62G		7790380022121	88.00	100.32	1.000	18	/uploads/7790380022121.jpg	2026-01-12 15:55:57.073291-03	2026-01-17 11:39:25.066701-03	f	\N	f	t	\N	\N	none	1
27241	CHOCOLATES CHUPELATIN		77909701	271.70	387.60	3.000	32	/uploads/77909701.jpg	2026-01-12 15:55:57.077425-03	2026-01-17 11:39:25.070591-03	f	\N	f	t	\N	\N	none	1
27243	CHOCOLATES FULL MANI  X 35G		7790380024408	610.50	750.00	4.000	18	/uploads/7790380024408.jpg	2026-01-12 15:55:57.085846-03	2026-01-17 11:39:25.079041-03	f	\N	f	t	\N	\N	none	1
27244	CHOCOLATES FULL MANII X 110		7790380005438	286.00	387.60	3.000	18	/uploads/7790380005438.jpg	2026-01-12 15:55:57.090088-03	2026-01-17 11:39:25.083757-03	f	\N	f	t	\N	\N	none	1
27245	CHOCOLATES KINDER MAXI		80050094	0.00	0.00	0.000	32	/uploads/80050094.jpg	2026-01-12 15:55:57.09446-03	2026-01-17 11:39:25.090295-03	f	\N	f	t	\N	\N	none	1
27246	CHOCOLATES KINDER MINI BARRITAS		80050315	672.10	900.00	13.000	32	/uploads/80050315.jpg	2026-01-12 15:55:57.098684-03	2026-01-17 11:39:25.095511-03	f	\N	f	t	\N	\N	none	1
27248	CHOCOLATES MISKY CHOCOLATIN NEGRO Y BLANCO		77958594	0.00	0.00	0.000	18	/uploads/77958594.jpg	2026-01-12 15:55:57.106581-03	2026-01-17 11:39:25.105919-03	f	\N	f	t	\N	\N	none	1
27249	CHOCOLATES PARAGUITAS FEL FORT		7790206009503	612.70	850.00	-21.000	18	/uploads/7790206009503.jpg	2026-01-12 15:55:57.139472-03	2026-01-17 11:39:25.111213-03	f	\N	f	t	\N	\N	none	1
27250	CHOCOLATES ROCKLETS ARCOR X40G		7790580327415	0.00	0.00	0.000	18	/uploads/7790580327415.jpg	2026-01-12 15:55:57.143614-03	2026-01-17 11:39:25.117365-03	f	\N	f	t	\N	\N	none	1
27251	CHOCOLATES ROCKLETS X 20 G		7790580421007	596.20	800.00	14.000	18	/uploads/7790580421007.jpg	2026-01-12 15:55:57.147742-03	2026-01-17 11:39:25.122671-03	f	\N	f	t	\N	\N	none	1
27253	CHOCOLATES TITA		77976291	559.90	700.00	9.000	32	/uploads/77976291.jpg	2026-01-12 15:55:57.155585-03	2026-01-17 11:39:25.134916-03	f	\N	f	t	\N	\N	none	1
27254	CONDIMENTOS ADOBO P/ PIZZA ALICANTE X25G		7790150490396	826.10	1200.00	10.000	14	/uploads/7790150490396.jpg	2026-01-12 15:55:57.160011-03	2026-01-17 11:39:25.140134-03	f	\N	f	t	\N	\N	none	1
27255	CONDIMENTOS AJI TRITURADO		7790150406915	767.80	1000.00	18.000	14	/uploads/7790150406915.jpg	2026-01-12 15:55:57.164053-03	2026-01-17 11:39:25.144817-03	f	\N	f	t	\N	\N	none	1
27256	CONDIMENTOS ALICANTE OREGANO X50G		7790150540350	0.00	0.00	0.000	14	/uploads/7790150540350.jpg	2026-01-12 15:55:57.168169-03	2026-01-17 11:39:25.148758-03	f	\N	f	t	\N	\N	none	1
27257	CONDIMENTOS ALICANTE VAINILLA		7790150052457	0.00	0.00	1.000	21	/uploads/7790150052457.jpg	2026-01-12 15:55:57.172261-03	2026-01-17 11:39:25.152067-03	f	\N	f	t	\N	\N	none	1
27258	CONDIMENTOS BICARBONATO		7790150430330	566.50	900.00	12.000	14	/uploads/7790150430330.jpg	2026-01-12 15:55:57.176639-03	2026-01-17 11:39:25.155965-03	f	\N	f	t	\N	\N	none	1
27260	CONDIMENTOS CHIMICHIRRI ALICANTE		7790150445259	983.40	1300.00	11.000	14	/uploads/7790150445259.jpg	2026-01-12 15:55:57.185912-03	2026-01-17 11:39:25.162589-03	f	\N	f	t	\N	\N	none	1
27263	CONDIMENTOS CONDIMENTO PARA MILANESAS		7790150497081	0.00	0.00	0.000	14	/uploads/7790150497081.jpg	2026-01-12 15:55:57.202674-03	2026-01-17 11:39:25.171809-03	f	\N	f	t	\N	\N	none	1
27305	FIAMBRERIA MAR DEL PLATA		QUESOO	13090.00	20000.00	6.100	20	/uploads/QUESOO.jpg	2026-01-12 15:55:57.381258-03	2026-01-17 11:39:25.360373-03	f	\N	f	t	\N	\N	none	1
27264	CONDIMENTOS CONDIMENTOS		CONDIMENTOS SUELTOS	385.00	450.00	-180.000	14	/uploads/CONDIMENTOS SUELTOS.jpg	2026-01-12 15:55:57.207996-03	2026-01-17 11:39:25.176054-03	f	\N	f	t	\N	\N	none	1
27265	CONDIMENTOS NUEZ MOSCADA EN GRANO		7796373002378	0.00	0.00	0.000	14	/uploads/7796373002378.jpg	2026-01-12 15:55:57.213001-03	2026-01-17 11:39:25.181293-03	f	\N	f	t	\N	\N	none	1
27266	CONDIMENTOS NUEZ MOSCADO MOLIDA		7790150535394	1769.90	2300.00	12.000	14	/uploads/7790150535394.jpg	2026-01-12 15:55:57.217997-03	2026-01-17 11:39:25.18664-03	f	\N	f	t	\N	\N	none	1
27269	CONDIMENTOS PEREJIL ALICANTE		7790150545256	0.00	0.00	0.000	14	/uploads/7790150545256.jpg	2026-01-12 15:55:57.233037-03	2026-01-17 11:39:25.194787-03	f	\N	f	t	\N	\N	none	1
27270	CONDIMENTOS PIMENTON ALICANTE		7790150564806	677.60	1000.00	5.000	14	/uploads/7790150564806.jpg	2026-01-12 15:55:57.240755-03	2026-01-17 11:39:25.199405-03	f	\N	f	t	\N	\N	none	1
27271	CONDIMENTOS PIMIENTA BLANCA MOLIDA		7790150550540	1497.10	1900.00	-3.000	14	/uploads/7790150550540.jpg	2026-01-12 15:55:57.245382-03	2026-01-17 11:39:25.203204-03	f	\N	f	t	\N	\N	none	1
27274	CONGELADOS HAMBURGURSAS 214		7796804024184	3716.90	4550.00	-7.000	17	/uploads/7796804024184.jpg	2026-01-12 15:55:57.259448-03	2026-01-17 11:39:25.210527-03	f	\N	f	t	\N	\N	none	1
27275	FARMACIA ACTRON 600 BAYER		1515	558.80	800.00	50.000	30	/uploads/1515.jpg	2026-01-12 15:55:57.264051-03	2026-01-17 11:39:25.214377-03	f	\N	f	t	\N	\N	none	1
27276	FARMACIA ALIKAL		1234	726.00	1200.00	8.000	30	/uploads/1234.jpg	2026-01-12 15:55:57.269006-03	2026-01-17 11:39:25.219327-03	f	\N	f	t	\N	\N	none	1
27278	FARMACIA BUSCAPINA COMPUESTA		12345678	511.50	800.00	18.000	30	/uploads/12345678.jpg	2026-01-12 15:55:57.276252-03	2026-01-17 11:39:25.229397-03	f	\N	f	t	\N	\N	none	1
27279	FARMACIA BUSCAPINA PERLAS		7795312108515	409.20	600.00	0.000	30	/uploads/7795312108515.jpg	2026-01-12 15:55:57.280387-03	2026-01-17 11:39:25.23404-03	f	\N	f	t	\N	\N	none	1
27280	FARMACIA DICLOFENAC 75MG		3456	50.60	200.00	3.000	30	/uploads/3456.jpg	2026-01-12 15:55:57.284425-03	2026-01-17 11:39:25.239519-03	f	\N	f	t	\N	\N	none	1
27281	FARMACIA DORIXINA		7795345000428	152.90	300.00	4.000	30	/uploads/7795345000428.jpg	2026-01-12 15:55:57.288044-03	2026-01-17 11:39:25.244461-03	f	\N	f	t	\N	\N	none	1
27282	FARMACIA IBU 600 FABOGESIC		1414	82.50	200.00	4.000	30	/uploads/1414.jpg	2026-01-12 15:55:57.291741-03	2026-01-17 11:39:25.249463-03	f	\N	f	t	\N	\N	none	1
27268	CONDIMENTOS OREGANO DOS ANCLAS		7792900009001	0.00	0.00	0.000	14	/uploads/7792900009001.jpg	2026-01-12 15:55:57.227936-03	2026-01-12 15:55:57.227936-03	f	\N	f	t	\N	\N	none	1
27284	FARMACIA IBUEVANOL RAPIDA ACCION		7794640141720	182.60	350.00	-25.000	30	/uploads/7794640141720.jpg	2026-01-12 15:55:57.298523-03	2026-01-17 11:39:25.264811-03	f	\N	f	t	\N	\N	none	1
27285	FARMACIA KETEROLAK		1524	42.90	200.00	-35.000	30	/uploads/1524.jpg	2026-01-12 15:55:57.30121-03	2026-01-17 11:39:25.270337-03	f	\N	f	t	\N	\N	none	1
27286	FARMACIA MEJORAL NIÑOS		2543	150.70	300.00	-2.000	30	/uploads/2543.jpg	2026-01-12 15:55:57.304199-03	2026-01-17 11:39:25.275572-03	f	\N	f	t	\N	\N	none	1
27273	CONDIMENTOS PROVENZAL		7792900009230	0.00	0.00	0.000	14	/uploads/7792900009230.jpg	2026-01-12 15:55:57.254655-03	2026-01-12 15:55:57.254655-03	f	\N	f	t	\N	\N	none	1
27287	FARMACIA PASTILLA CARBON		14963	0.00	250.00	-26.000	30	/uploads/14963.jpg	2026-01-12 15:55:57.307347-03	2026-01-17 11:39:25.280733-03	f	\N	f	t	\N	\N	none	1
27288	FARMACIA QURAPLUS		4215	265.10	500.00	-11.000	30	/uploads/4215.jpg	2026-01-12 15:55:57.312081-03	2026-01-17 11:39:25.285634-03	f	\N	f	t	\N	\N	none	1
27290	FARMACIA SERTAL COMPUESTO		7795345000367	473.00	750.00	-7.000	30	/uploads/7795345000367.jpg	2026-01-12 15:55:57.319714-03	2026-01-17 11:39:25.295913-03	f	\N	f	t	\N	\N	none	1
27291	FARMACIA SERTAL PERLAS		7795345121512	0.00	0.00	0.000	30	/uploads/7795345121512.jpg	2026-01-12 15:55:57.324291-03	2026-01-17 11:39:25.300812-03	f	\N	f	t	\N	\N	none	1
27292	FARMACIA TAFIROL 1G X8 U		4445555	196.90	350.00	-1.000	30	/uploads/4445555.jpg	2026-01-12 15:55:57.328333-03	2026-01-17 11:39:25.306703-03	f	\N	f	t	\N	\N	none	1
27293	FARMACIA TAFIROL COMUN		1254	167.20	300.00	-3.000	30	/uploads/1254.jpg	2026-01-12 15:55:57.332078-03	2026-01-17 11:39:25.312884-03	f	\N	f	t	\N	\N	none	1
27295	FARMACIA TAFIROL PLUS CAPSULA		1231	320.10	600.00	-17.000	30	/uploads/1231.jpg	2026-01-12 15:55:57.340469-03	2026-01-17 11:39:25.322889-03	f	\N	f	t	\N	\N	none	1
27297	FARMACIA TE BAYASPIRINA C		1213	856.90	1200.00	16.000	30	/uploads/1213.jpg	2026-01-12 15:55:57.347952-03	2026-01-17 11:39:25.327051-03	f	\N	f	t	\N	\N	none	1
27298	FARMACIA TE VICK		13131	0.00	2000.00	0.000	30	/uploads/13131.jpg	2026-01-12 15:55:57.352575-03	2026-01-17 11:39:25.331839-03	f	\N	f	t	\N	\N	none	1
27299	FARMACIA UVASAL		234	423.50	600.00	19.000	30	/uploads/234.jpg	2026-01-12 15:55:57.356782-03	2026-01-17 11:39:25.336393-03	f	\N	f	t	\N	\N	none	1
27301	FIAMBRERIA CHEDAR..X100G		CHEDAR FINLANDIA111111	12031.80	17000.00	1899.160	20	/uploads/CHEDAR FINLANDIA111111.jpg	2026-01-12 15:55:57.365596-03	2026-01-17 11:39:25.343539-03	f	\N	f	t	\N	\N	none	1
27302	FIAMBRERIA CHORIZO COLORADO XUNIDAD		7796804003011	3201.00	3950.00	-3.000	20	/uploads/7796804003011.jpg	2026-01-12 15:55:57.369625-03	2026-01-17 11:39:25.346523-03	f	\N	f	t	\N	\N	none	1
27303	FIAMBRERIA JAMON 214	\N	FIAMBRES	9460.00	14000.00	7.440	20	/uploads/FIAMBRES.jpg	2026-01-12 15:55:57.37344-03	2026-01-17 11:39:25.349734-03	t	\N	f	t	\N	\N	none	1
27306	FIAMBRERIA MATAMBRE DE CARNE X100G		FIAMBRE MAT	8320.40	12000.00	1.200	20	/uploads/FIAMBRE MAT.jpg	2026-01-12 15:55:57.384922-03	2026-01-17 11:39:25.365004-03	f	\N	f	t	\N	\N	none	1
27307	FIAMBRERIA MORTADELA 214 BOCHA		FIAMBRE MOR	7828.70	12000.00	-2.680	20	/uploads/FIAMBRE MOR.jpg	2026-01-12 15:55:57.388342-03	2026-01-17 11:39:25.370237-03	f	\N	f	t	\N	\N	none	1
27308	FIAMBRERIA PANCETA AHUMADA X100		14236	12973.40	18000.00	0.700	20	\N	2026-01-12 15:55:57.39181-03	2026-01-17 11:39:25.375563-03	f	\N	f	t	\N	\N	none	1
27309	FIAMBRERIA QUESO DE MAQUINA PUNTA DE AGUA		FISMBRE	9075.00	13000.00	8.800	20	/uploads/FISMBRE.jpg	2026-01-12 15:55:57.39599-03	2026-01-17 11:39:25.380947-03	f	\N	f	t	\N	\N	none	1
27312	FIAMBRERIA QUESO RAYAR X100G		QUESO P RALLAR	16053.40	20000.00	2.425	20	/uploads/QUESO P RALLAR.jpg	2026-01-12 15:55:57.406414-03	2026-01-17 11:39:25.392029-03	f	\N	f	t	\N	\N	none	1
27296	FARMACIA TAIROL FORTE		2345	20.00	384.75	2.000	30	/uploads/2345.jpg	2026-01-12 15:55:57.344149-03	2026-01-12 15:55:57.344149-03	f	\N	f	t	\N	\N	none	1
27313	FIAMBRERIA QUESO ROQUEFORT		QUESOROQUE	11006.60	15000.00	0.930	20	/uploads/QUESOROQUE.jpg	2026-01-12 15:55:57.411409-03	2026-01-17 11:39:25.395815-03	f	\N	f	t	\N	\N	none	1
27315	FIAMBRERIA SALCHICHON PRIMAVERA 214		FAMBRE SAL	6985.00	10000.00	1.730	20	/uploads/FAMBRE SAL.jpg	2026-01-12 15:55:57.419916-03	2026-01-17 11:39:25.401272-03	f	\N	f	t	\N	\N	none	1
27316	FRESCOS CHEDAR  X10 FETAS		7798060852716	1826.00	2300.00	-15.000	42	/uploads/7798060852716.jpg	2026-01-12 15:55:57.422779-03	2026-01-17 11:39:25.404052-03	f	\N	f	t	\N	\N	none	1
27318	FRESCOS MANTECA LA SERENISIMA X200		7790742345806	3012.90	3700.00	4.000	42	/uploads/7790742345806.jpg	2026-01-12 15:55:57.428227-03	2026-01-17 11:39:25.40964-03	f	\N	f	t	\N	\N	none	1
27319	FRESCOS MANTECA TONADITA X200		7798060850026	2345.20	2900.00	7.000	42	/uploads/7798060850026.jpg	2026-01-12 15:55:57.430614-03	2026-01-17 11:39:25.412692-03	f	\N	f	t	\N	\N	none	1
27320	FRESCOS SALCHICHAS 214 X12		7796804017186	2800.60	3500.00	9.000	42	/uploads/7796804017186.jpg	2026-01-12 15:55:57.434023-03	2026-01-17 11:39:25.416059-03	f	\N	f	t	\N	\N	none	1
27671	FARMACIA MIGRAL		500	357.50	650.00	-1.000	30	/uploads/500.jpg	2026-01-12 15:55:58.650198-03	2026-01-17 11:39:26.759458-03	f	\N	f	t	\N	\N	none	1
27310	FIAMBRERIA MUZA PUNTA DE AGUA		FIAMBRE MUZA	0.00	0.00	0.000	20	/uploads/FIAMBRE MUZA.jpg	2026-01-12 15:55:57.399636-03	2026-01-12 15:55:57.399636-03	f	\N	f	t	\N	\N	none	1
27322	FRESCOS SALCHICHAS CHAMPION X6		7796804047015	1366.20	1800.00	19.000	42	/uploads/7796804047015.jpg	2026-01-12 15:55:57.44131-03	2026-01-17 11:39:25.421423-03	f	\N	f	t	\N	\N	none	1
27323	FRESCOS TAPAS EMPANADA HOJALDRE ORALI		7791218000021	1144.00	1450.00	-3.000	42	/uploads/7791218000021.jpg	2026-01-12 15:55:57.444119-03	2026-01-17 11:39:25.424558-03	f	\N	f	t	\N	\N	none	1
27324	FRESCOS TAPAS EMPANADA ORALI X12		7791218000090	1051.60	1350.00	6.000	42	/uploads/7791218000090.jpg	2026-01-12 15:55:57.446845-03	2026-01-17 11:39:25.427791-03	f	\N	f	t	\N	\N	none	1
27326	FRESCOS PASCUALINA ORALI CRIOLLA		7791218000144	1410.20	1800.00	0.000	42	/uploads/7791218000144.jpg	2026-01-12 15:55:57.451721-03	2026-01-17 11:39:25.434708-03	f	\N	f	t	\N	\N	none	1
27327	FRESCOS PASCUALINA SANTIAGUEÑA CRIOLLA		7793806000253	1265.00	1650.00	8.000	42	/uploads/7793806000253.jpg	2026-01-12 15:55:57.454085-03	2026-01-17 11:39:25.439569-03	f	\N	f	t	\N	\N	none	1
27328	FRESCOS TAPAS EMPANADAS LA SANTIAGUEÑ		7793806000147	1104.40	1400.00	-21.000	42	/uploads/7793806000147.jpg	2026-01-12 15:55:57.456896-03	2026-01-17 11:39:25.442989-03	f	\N	f	t	\N	\N	none	1
27329	FRUTAS SECAS CIRUELAS  D'AGEN SIN CAROZO		1112	8613.00	12000.00	1.270	35	/uploads/1112.jpg	2026-01-12 15:55:57.460023-03	2026-01-17 11:39:25.447021-03	f	\N	f	t	\N	\N	none	1
27331	GALLETITAS AMOR		7790040930407	1085.70	1350.00	3.000	25	/uploads/7790040930407.jpg	2026-01-12 15:55:57.465158-03	2026-01-17 11:39:25.452947-03	f	\N	f	t	\N	\N	none	1
27332	GALLETITAS ANIMACION		7792684000652	1218.80	1600.00	1.000	25	/uploads/7792684000652.jpg	2026-01-12 15:55:57.467973-03	2026-01-17 11:39:25.457109-03	f	\N	f	t	\N	\N	none	1
27363	GALLETITAS ME BRILLITOS X500		MMMMMM	154.00	769.50	3.000	25	\N	2026-01-12 15:55:57.553283-03	2026-01-12 15:55:57.553283-03	f	\N	f	t	\N	\N	none	1
27333	GALLETITAS ARROOZ INTEGRAL		7797457010210	885.50	1100.00	29.000	25	/uploads/7797457010210.jpg	2026-01-12 15:55:57.470582-03	2026-01-17 11:39:25.459953-03	f	\N	f	t	\N	\N	none	1
27334	GALLETITAS BAGLEY C/SALVADO		7790040129559	979.00	1250.00	0.000	25	/uploads/7790040129559.jpg	2026-01-12 15:55:57.473018-03	2026-01-17 11:39:25.46319-03	f	\N	f	t	\N	\N	none	1
27335	GALLETITAS BISCUITS		7792184003146	1098.90	1450.00	4.000	25	/uploads/7792184003146.jpg	2026-01-12 15:55:57.475529-03	2026-01-17 11:39:25.465891-03	f	\N	f	t	\N	\N	none	1
27337	GALLETITAS BIZCOCHOS 9DE  ORO		7792200000159	787.60	1100.00	-2.000	25	/uploads/7792200000159.jpg	2026-01-12 15:55:57.480577-03	2026-01-17 11:39:25.471429-03	f	\N	f	t	\N	\N	none	1
27338	GALLETITAS BIZCOCHOS CON GRASA JORGITO		7790957000668	645.70	900.00	24.000	25	/uploads/7790957000668.jpg	2026-01-12 15:55:57.483247-03	2026-01-17 11:39:25.473907-03	f	\N	f	t	\N	\N	none	1
27339	GALLETITAS BIZCOCHOS DON SATUR SALADO		7795735000328	884.40	1200.00	21.000	25	/uploads/7795735000328.jpg	2026-01-12 15:55:57.486165-03	2026-01-17 11:39:25.478116-03	f	\N	f	t	\N	\N	none	1
27340	GALLETITAS BUDIN DON SATUR C/FRUTA		7795735601051	2200.00	2400.00	-4.000	25	/uploads/7795735601051.jpg	2026-01-12 15:55:57.488923-03	2026-01-17 11:39:25.481596-03	f	\N	f	t	\N	\N	none	1
27342	GALLETITAS CAÑONCITOS		7795733001099	764.50	1000.00	12.000	25	/uploads/7795733001099.jpg	2026-01-12 15:55:57.493803-03	2026-01-17 11:39:25.488812-03	f	\N	f	t	\N	\N	none	1
27343	GALLETITAS CEREALITAS		7622300840259	1175.90	1700.00	9.000	25	/uploads/7622300840259.jpg	2026-01-12 15:55:57.496292-03	2026-01-17 11:39:25.492918-03	f	\N	f	t	\N	\N	none	1
27344	GALLETITAS CHIPS TURIMAR		77969903	700.70	950.00	2.000	25	/uploads/77969903.jpg	2026-01-12 15:55:57.498908-03	2026-01-17 11:39:25.496043-03	f	\N	f	t	\N	\N	none	1
27345	GALLETITAS CHOCO VAN		7798017860382	534.60	680.00	9.000	25	/uploads/7798017860382.jpg	2026-01-12 15:55:57.501455-03	2026-01-17 11:39:25.498683-03	f	\N	f	t	\N	\N	none	1
27347	GALLETITAS CHOCOLINAS X250 GS		7790040111004	1224.30	1700.00	40.000	25	/uploads/7790040111004.jpg	2026-01-12 15:55:57.506413-03	2026-01-17 11:39:25.505252-03	f	\N	f	t	\N	\N	none	1
27349	GALLETITAS COQUITOS		7791324156834	672.10	900.00	-4.000	25	/uploads/7791324156834.jpg	2026-01-12 15:55:57.512606-03	2026-01-17 11:39:25.509047-03	f	\N	f	t	\N	\N	none	1
27350	GALLETITAS CRIOLLITA X 3		7790040377806	1160.50	1600.00	0.000	21	/uploads/7790040377806.jpg	2026-01-12 15:55:57.515922-03	2026-01-17 11:39:25.5126-03	f	\N	f	t	\N	\N	none	1
27352	GALLETITAS EXPRES X 3		7622201509194	1125.30	1450.00	-1.000	25	/uploads/7622201509194.jpg	2026-01-12 15:55:57.521522-03	2026-01-17 11:39:25.518272-03	f	\N	f	t	\N	\N	none	1
27353	GALLETITAS FRUTIGRAM AVENA Y PASAS		7790045001188	1489.40	1950.00	0.000	25	/uploads/7790045001188.jpg	2026-01-12 15:55:57.523961-03	2026-01-17 11:39:25.521038-03	f	\N	f	t	\N	\N	none	1
27354	GALLETITAS FRUTIGRAN CHIPS DE CHOCO		7790045824893	2173.60	2750.00	3.000	25	/uploads/7790045824893.jpg	2026-01-12 15:55:57.526463-03	2026-01-17 11:39:25.523669-03	f	\N	f	t	\N	\N	none	1
27355	GALLETITAS FRUTIGRAN TROPICAL		7790045000815	0.00	0.00	3.000	25	/uploads/7790045000815.jpg	2026-01-12 15:55:57.528987-03	2026-01-17 11:39:25.526464-03	f	\N	f	t	\N	\N	none	1
27357	GALLETITAS GALLES SURTIDAS DE BAGLEY		7790040132771	2515.70	2950.00	-14.000	25	/uploads/7790040132771.jpg	2026-01-12 15:55:57.534687-03	2026-01-17 11:39:25.533368-03	f	\N	f	t	\N	\N	none	1
27358	GALLETITAS GALLETITAS LINCOL		7622300829643	1404.70	1900.00	3.000	25	/uploads/7622300829643.jpg	2026-01-12 15:55:57.538185-03	2026-01-17 11:39:25.537234-03	f	\N	f	t	\N	\N	none	1
27359	GALLETITAS HOJALMAR SNACK MATERO X 180 GMS		7793450000593	1134.10	1550.00	18.000	25	/uploads/7793450000593.jpg	2026-01-12 15:55:57.541384-03	2026-01-17 11:39:25.541138-03	f	\N	f	t	\N	\N	none	1
27360	GALLETITAS HOJALMAR TRIANGULOS		7793450000128	977.90	1300.00	6.000	25	/uploads/7793450000128.jpg	2026-01-12 15:55:57.544014-03	2026-01-17 11:39:25.544966-03	f	\N	f	t	\N	\N	none	1
27361	GALLETITAS LEIVA MARIA		7790412000950	234.30	319.20	3.000	25	/uploads/7790412000950.jpg	2026-01-12 15:55:57.546533-03	2026-01-17 11:39:25.549398-03	f	\N	f	t	\N	\N	none	1
27364	GALLETITAS MEDIA TARDE SANDWICH		7790040887602	1035.10	1350.00	-1.000	25	/uploads/7790040887602.jpg	2026-01-12 15:55:57.557066-03	2026-01-17 11:39:25.556879-03	f	\N	f	t	\N	\N	none	1
27348	GALLETITAS CLUB SOCIAL		7622210692245	0.00	0.00	0.000	25	/uploads/7622210692245.jpg	2026-01-12 15:55:57.509311-03	2026-01-12 15:55:57.509311-03	f	\N	f	t	\N	\N	none	1
27365	GALLETITAS MEDIA TARDE X 3		7790270336307	876.70	1300.00	7.000	25	/uploads/7790270336307.jpg	2026-01-12 15:55:57.562157-03	2026-01-17 11:39:25.560322-03	f	\N	f	t	\N	\N	none	1
27366	GALLETITAS MELINA BANANITAS		7798025370026	787.60	1000.00	24.000	25	/uploads/7798025370026.jpg	2026-01-12 15:55:57.56823-03	2026-01-17 11:39:25.563984-03	f	\N	f	t	\N	\N	none	1
27367	GALLETITAS MELLIZAS		7790040930209	1071.40	1350.00	2.000	25	/uploads/7790040930209.jpg	2026-01-12 15:55:57.572857-03	2026-01-17 11:39:25.567159-03	f	\N	f	t	\N	\N	none	1
27369	GALLETITAS MERENGADAS		7790040932708	1071.40	1350.00	5.000	25	/uploads/7790040932708.jpg	2026-01-12 15:55:57.581719-03	2026-01-17 11:39:25.574754-03	f	\N	f	t	\N	\N	none	1
27370	GALLETITAS MERENGUES URQUIZA		7798177410106	748.00	950.00	22.000	25	/uploads/7798177410106.jpg	2026-01-12 15:55:57.586516-03	2026-01-17 11:39:25.57913-03	f	\N	f	t	\N	\N	none	1
27371	GALLETITAS MINIALFAJOR  X 160G		7792684001673	1197.90	1700.00	16.000	25	/uploads/7792684001673.jpg	2026-01-12 15:55:57.589603-03	2026-01-17 11:39:25.582483-03	f	\N	f	t	\N	\N	none	1
27372	GALLETITAS MINI CORONITAS X 140 GS		7790369000997	822.80	1100.00	11.000	25	/uploads/7790369000997.jpg	2026-01-12 15:55:57.592356-03	2026-01-17 11:39:25.589776-03	f	\N	f	t	\N	\N	none	1
27373	GALLETITAS MINI MANTECADAS		7791324156919	672.10	850.00	1.000	25	/uploads/7791324156919.jpg	2026-01-12 15:55:57.595627-03	2026-01-17 11:39:25.594087-03	f	\N	f	t	\N	\N	none	1
27376	GALLETITAS MOROCHITAS CON CACAO		7791324156827	720.50	900.00	0.000	25	/uploads/7791324156827.jpg	2026-01-12 15:55:57.608492-03	2026-01-17 11:39:25.604358-03	f	\N	f	t	\N	\N	none	1
27377	GALLETITAS NS 5 CEREALES		7798179490052	517.00	800.00	-2.000	25	/uploads/7798179490052.jpg	2026-01-12 15:55:57.612344-03	2026-01-17 11:39:25.609593-03	f	\N	f	t	\N	\N	none	1
27375	GALLETITAS MINIAFAJOR X 80GMS		7792684000393	0.00	0.00	0.000	25	/uploads/7792684000393.jpg	2026-01-12 15:55:57.604684-03	2026-01-12 15:55:57.604684-03	f	\N	f	t	\N	\N	none	1
27422	GASEOSAS PASO DE LOS TOROS TONICA X1 1/2		7791813421368	2002.00	2650.00	1.000	49	/uploads/7791813421368.jpg	2026-01-12 15:55:57.835444-03	2026-01-17 11:39:25.777178-03	f	\N	f	t	\N	\N	none	1
27418	GASEOSAS GAS.COCA VIDRIO		7790895001598	1454.20	2100.00	0.000	49	/uploads/7790895001598.jpg	2026-01-12 15:55:57.818405-03	2026-01-17 11:39:25.760173-03	f	\N	f	t	\N	\N	none	1
27380	GALLETITAS OKEBON GIRO TONDO		7790263119412	891.00	1100.00	0.000	25	/uploads/7790263119412.jpg	2026-01-12 15:55:57.626935-03	2026-01-17 11:39:25.626806-03	f	\N	f	t	\N	\N	none	1
27381	GALLETITAS OKEBON X150		7790263110839	721.60	950.00	11.000	25	/uploads/7790263110839.jpg	2026-01-12 15:55:57.631226-03	2026-01-17 11:39:25.632621-03	f	\N	f	t	\N	\N	none	1
27384	GALLETITAS OREO		7622201806286	1364.00	1750.00	5.000	25	/uploads/7622201806286.jpg	2026-01-12 15:55:57.671378-03	2026-01-17 11:39:25.643073-03	f	\N	f	t	\N	\N	none	1
27385	GALLETITAS PAN  DULCE. DON  SATUR		7795735600993	2882.00	3650.00	2.000	25	/uploads/7795735600993.jpg	2026-01-12 15:55:57.674069-03	2026-01-17 11:39:25.647201-03	f	\N	f	t	\N	\N	none	1
27387	GALLETITAS PAN DULCE CHIP DE CHOCO DON SATUR		7795735601006	3220.80	4250.00	1.000	25	/uploads/7795735601006.jpg	2026-01-12 15:55:57.67919-03	2026-01-17 11:39:25.652569-03	f	\N	f	t	\N	\N	none	1
27388	GALLETITAS PASEO 5 SEMILLAS		7792180007315	1134.10	1450.00	0.000	25	/uploads/7792180007315.jpg	2026-01-12 15:55:57.681827-03	2026-01-17 11:39:25.655117-03	f	\N	f	t	\N	\N	none	1
27389	GALLETITAS PEPAS DE LA NONA X180G		7798048730883	456.50	750.00	20.000	25	/uploads/7798048730883.jpg	2026-01-12 15:55:57.686481-03	2026-01-17 11:39:25.658274-03	f	\N	f	t	\N	\N	none	1
27390	GALLETITAS PEPAS TRIO 320G		7791787100924	0.00	0.00	0.000	25	/uploads/7791787100924.jpg	2026-01-12 15:55:57.691127-03	2026-01-17 11:39:25.660978-03	f	\N	f	t	\N	\N	none	1
27391	GALLETITAS PEPAS TRIO CHIPS		7791787100689	0.00	0.00	-1.000	25	/uploads/7791787100689.jpg	2026-01-12 15:55:57.695145-03	2026-01-17 11:39:25.663588-03	f	\N	f	t	\N	\N	none	1
27392	GALLETITAS PEPAS TRIO X 200GMS		7791787000422	544.50	800.00	3.000	25	/uploads/7791787000422.jpg	2026-01-12 15:55:57.699993-03	2026-01-17 11:39:25.66625-03	f	\N	f	t	\N	\N	none	1
27394	GALLETITAS PEPITOS		7622201808662	984.50	1350.00	15.000	25	/uploads/7622201808662.jpg	2026-01-12 15:55:57.70988-03	2026-01-17 11:39:25.672229-03	f	\N	f	t	\N	\N	none	1
27395	GALLETITAS PINDI		7798113151322	709.50	900.00	4.000	25	/uploads/7798113151322.jpg	2026-01-12 15:55:57.714933-03	2026-01-17 11:39:25.676461-03	f	\N	f	t	\N	\N	none	1
27383	GALLETITAS OPERAS X92G		77903518	0.00	0.00	3.000	25	/uploads/77903518.jpg	2026-01-12 15:55:57.668156-03	2026-01-12 15:55:57.668156-03	f	\N	f	t	\N	\N	none	1
27396	GALLETITAS PITUSAS CHOCOLATE X160		7791324157046	800.80	1100.00	11.000	25	/uploads/7791324157046.jpg	2026-01-12 15:55:57.724146-03	2026-01-17 11:39:25.680062-03	f	\N	f	t	\N	\N	none	1
27397	GALLETITAS POCHOCLO		7785454679998	897.60	1150.00	-6.000	25	/uploads/7785454679998.jpg	2026-01-12 15:55:57.730459-03	2026-01-17 11:39:25.68531-03	f	\N	f	t	\N	\N	none	1
27399	GALLETITAS RC SIN SAL GRANDES		7790697001055	1834.80	2450.00	-1.000	25	/uploads/7790697001055.jpg	2026-01-12 15:55:57.741251-03	2026-01-17 11:39:25.691277-03	f	\N	f	t	\N	\N	none	1
27400	GALLETITAS RUMBA		7790040930506	1071.40	1400.00	8.000	25	/uploads/7790040930506.jpg	2026-01-12 15:55:57.745907-03	2026-01-17 11:39:25.694127-03	f	\N	f	t	\N	\N	none	1
27401	GALLETITAS SONRISAS		7790040133488	1071.40	1350.00	3.000	25	/uploads/7790040133488.jpg	2026-01-12 15:55:57.750561-03	2026-01-17 11:39:25.697759-03	f	\N	f	t	\N	\N	none	1
27402	GALLETITAS SUAVECITAS PARNOR		7791324156926	720.50	1000.00	0.000	25	/uploads/7791324156926.jpg	2026-01-12 15:55:57.755281-03	2026-01-17 11:39:25.701558-03	f	\N	f	t	\N	\N	none	1
27404	GALLETITAS MINI TAPITAS		7790369000249	932.80	1200.00	4.000	25	/uploads/7790369000249.jpg	2026-01-12 15:55:57.765558-03	2026-01-17 11:39:25.7087-03	f	\N	f	t	\N	\N	none	1
27405	GALLETITAS TODDY GALLETITAS		7790310982846	1611.50	2000.00	0.000	\N	/uploads/7790310982846.jpg	2026-01-12 15:55:57.770513-03	2026-01-17 11:39:25.712387-03	f	\N	f	t	\N	\N	none	1
27406	GALLETITAS TOSTADAS DE ARROZ RISKY		768680620030	0.00	0.00	0.000	25	/uploads/768680620030.jpg	2026-01-12 15:55:57.775339-03	2026-01-17 11:39:25.716148-03	f	\N	f	t	\N	\N	none	1
27407	GALLETITAS TOSTADAS RIERAD DULCES		7790071090118	1118.70	1400.00	-1.000	25	/uploads/7790071090118.jpg	2026-01-12 15:55:57.779551-03	2026-01-17 11:39:25.718908-03	f	\N	f	t	\N	\N	none	1
27408	GALLETITAS TRAVIATA ORIGINA!		7790040872202	1296.90	1700.00	2.000	25	/uploads/7790040872202.jpg	2026-01-12 15:55:57.78344-03	2026-01-17 11:39:25.721483-03	f	\N	f	t	\N	\N	none	1
27410	GALLETITAS VAINILLAS POZO		7790077000067	624.80	770.00	0.000	25	/uploads/7790077000067.jpg	2026-01-12 15:55:57.792658-03	2026-01-17 11:39:25.728161-03	f	\N	f	t	\N	\N	none	1
27411	GALLETITAS VOCACION		7790040131187	657.80	900.00	7.000	25	/uploads/7790040131187.jpg	2026-01-12 15:55:57.796701-03	2026-01-17 11:39:25.73098-03	f	\N	f	t	\N	\N	none	1
27412	GALLETITAS VOCACION ACARAMELADAS		7790040133211	0.00	0.00	0.000	25	/uploads/7790040133211.jpg	2026-01-12 15:55:57.799487-03	2026-01-17 11:39:25.733389-03	f	\N	f	t	\N	\N	none	1
27413	GASEOSAS COCA X 500		7790895000782	1320.00	1800.00	12.000	49	/uploads/7790895000782.jpg	2026-01-12 15:55:57.801913-03	2026-01-17 11:39:25.736335-03	f	\N	f	t	\N	\N	none	1
27414	GASEOSAS COCA X354		7790895000232	1265.00	1800.00	24.000	49	/uploads/7790895000232.jpg	2026-01-12 15:55:57.80435-03	2026-01-17 11:39:25.740372-03	f	\N	f	t	\N	\N	none	1
27416	GASEOSAS GAS.COCA  1/5 LTS		7790895067570	2436.50	3300.00	-20.000	49	/uploads/7790895067570.jpg	2026-01-12 15:55:57.810521-03	2026-01-17 11:39:25.746673-03	f	\N	f	t	\N	\N	none	1
27417	GASEOSAS GAS.COCA COLA 2L1/4	\N	7790895000997	3182.30	4100.00	-22.000	49	/uploads/7790895000997.jpg	2026-01-12 15:55:57.814923-03	2026-01-17 11:39:25.750704-03	f	\N	f	t	\N	\N	none	1
27420	GASEOSAS GAS.CUNINGTON TONICA		7790639001068	96.80	307.80	6.000	49	/uploads/7790639001068.jpg	2026-01-12 15:55:57.827715-03	2026-01-17 11:39:25.770142-03	f	\N	f	t	\N	\N	none	1
27423	GASEOSAS PEPSI		7791813555056	1936.00	3000.00	12.000	49	/uploads/7791813555056.jpg	2026-01-12 15:55:57.838837-03	2026-01-17 11:39:25.779707-03	f	\N	f	t	\N	\N	none	1
27424	GOLOSINAS ALFAJOR ESCOLAR CHOCOLATE		77958266	159.50	250.00	54.000	18	/uploads/77958266.jpg	2026-01-12 15:55:57.84155-03	2026-01-17 11:39:25.78203-03	f	\N	f	t	\N	\N	none	1
27426	GOLOSINAS ALFAJOR FULBITO		77902320	137.50	200.00	20.000	18	/uploads/77902320.jpg	2026-01-12 15:55:57.848107-03	2026-01-17 11:39:25.78758-03	f	\N	f	t	\N	\N	none	1
27427	GOLOSINAS ALFAJOR GUAYMALLEN BLANCO		77980212	236.50	350.00	-37.000	18	/uploads/77980212.jpg	2026-01-12 15:55:57.851814-03	2026-01-17 11:39:25.79-03	f	\N	f	t	\N	\N	none	1
27428	GOLOSINAS ALFAJOR JORGELIN TRIPLE		77901729	834.90	1100.00	5.000	18	/uploads/77901729.jpg	2026-01-12 15:55:57.854831-03	2026-01-17 11:39:25.792777-03	f	\N	f	t	\N	\N	none	1
27429	GOLOSINAS ALFAJOR JORGITO NEGRO Y BLANCO		77905741	569.80	800.00	1.000	18	/uploads/77905741.jpg	2026-01-12 15:55:57.857578-03	2026-01-17 11:39:25.795665-03	f	\N	f	t	\N	\N	none	1
27431	GOLOSINAS ALFAJOR MAIZENA ARTESANAL		222	0.00	0.00	1.000	18	/uploads/222.jpg	2026-01-12 15:55:57.863209-03	2026-01-17 11:39:25.801438-03	f	\N	f	t	\N	\N	none	1
27432	GOLOSINAS ALFAJOR MANON DULCE D LECHE		77980168	0.00	0.00	6.000	18	/uploads/77980168.jpg	2026-01-12 15:55:57.86561-03	2026-01-17 11:39:25.803932-03	f	\N	f	t	\N	\N	none	1
27433	GOLOSINAS ALFAJOR MILKA MOUSSE		7622300759506	542.30	750.00	18.000	18	/uploads/7622300759506.jpg	2026-01-12 15:55:57.86822-03	2026-01-17 11:39:25.807376-03	f	\N	f	t	\N	\N	none	1
27434	GOLOSINAS ALFAJOR MILKA OREO TORTA		7622300835620	0.00	0.00	0.000	18	/uploads/7622300835620.jpg	2026-01-12 15:55:57.870644-03	2026-01-17 11:39:25.809981-03	f	\N	f	t	\N	\N	none	1
27435	GOLOSINAS ALFAJOR MILKA TRIPLE		77903778	793.10	1100.00	-16.000	18	/uploads/77903778.jpg	2026-01-12 15:55:57.87298-03	2026-01-17 11:39:25.812422-03	f	\N	f	t	\N	\N	none	1
27437	GOLOSINAS ALFAJOR PEPITOS		77915481	1008.70	1300.00	48.000	18	/uploads/77915481.jpg	2026-01-12 15:55:57.878013-03	2026-01-17 11:39:25.818675-03	f	\N	f	t	\N	\N	none	1
27421	GASEOSAS GASE.MANAOS COLA	\N	7798113300010	1343.10	1600.00	34.000	49	/uploads/7798113300010.jpg	2026-01-12 15:55:57.831307-03	2026-01-17 11:39:25.773752-03	f	\N	f	t	\N	\N	none	1
27439	GOLOSINAS ALFAJOR TERRABUSSI TRIPLE		77903860	843.70	1100.00	0.000	18	/uploads/77903860.jpg	2026-01-12 15:55:57.882792-03	2026-01-17 11:39:25.822349-03	f	\N	f	t	\N	\N	none	1
27441	GOLOSINAS ALFAJOR TRI SHOT		77956699	1008.70	1300.00	9.000	18	/uploads/77956699.jpg	2026-01-12 15:55:57.887629-03	2026-01-17 11:39:25.831039-03	f	\N	f	t	\N	\N	none	1
27442	GOLOSINAS ALFAJORES COLAR BLANCO		77958259	37.40	57.00	20.000	18	/uploads/77958259.jpg	2026-01-12 15:55:57.890088-03	2026-01-17 11:39:25.835198-03	f	\N	f	t	\N	\N	none	1
27443	GOLOSINAS BARRA DE CEREALES KIWI MANZANA		7790206509164	476.30	650.00	40.000	18	/uploads/7790206509164.jpg	2026-01-12 15:55:57.892437-03	2026-01-17 11:39:25.838829-03	f	\N	f	t	\N	\N	none	1
27444	GOLOSINAS BELDENT MENTA FUERTE		77969088	490.60	800.00	42.000	18	/uploads/77969088.jpg	2026-01-12 15:55:57.894815-03	2026-01-17 11:39:25.842177-03	f	\N	f	t	\N	\N	none	1
27445	GOLOSINAS BLOCAZO		7790580115579	1320.00	1425.00	1.000	18	\N	2026-01-12 15:55:57.897239-03	2026-01-17 11:39:25.846951-03	f	\N	f	t	\N	\N	none	1
27446	GOLOSINAS BOM BOM MILKA OREO		77971630	473.00	650.00	10.000	18	/uploads/77971630.jpg	2026-01-12 15:55:57.899675-03	2026-01-17 11:39:25.849569-03	f	\N	f	t	\N	\N	none	1
27447	GOLOSINAS BONOBOM X. 30		77958921	341.00	500.00	52.000	18	/uploads/77958921.jpg	2026-01-12 15:55:57.902048-03	2026-01-17 11:39:25.852209-03	f	\N	f	t	\N	\N	none	1
27449	GOLOSINAS CARAMELOS MENTA CRISTAL CRISTAL		7790580118341	37.40	50.00	-714.000	18	/uploads/7790580118341.jpg	2026-01-12 15:55:57.907471-03	2026-01-17 11:39:25.866934-03	f	\N	f	t	\N	\N	none	1
27450	GOLOSINAS CARAMELO MASTICABLE MISKI X233		7790580178109	23.10	33.00	79.000	18	/uploads/7790580178109.jpg	2026-01-12 15:55:57.910784-03	2026-01-17 11:39:25.872388-03	f	\N	f	t	\N	\N	none	1
27451	GOLOSINAS CARAMELOS  CRISTAL  MIEL 135 UNIDADES		7790580118280	82.50	100.00	104.000	18	/uploads/7790580118280.jpg	2026-01-12 15:55:57.913807-03	2026-01-17 11:39:25.877546-03	f	\N	f	t	\N	\N	none	1
27452	GOLOSINAS CARAMELOS DE MIEL Y MENTA		7790580118297	0.00	0.00	0.000	18	/uploads/7790580118297.jpg	2026-01-12 15:55:57.916337-03	2026-01-17 11:39:25.882688-03	f	\N	f	t	\N	\N	none	1
27454	GOLOSINAS CARMELOS ACIDOS RODAJAS		9798522214104	33.00	50.00	190.000	18	/uploads/9798522214104.jpg	2026-01-12 15:55:57.921199-03	2026-01-17 11:39:25.89094-03	f	\N	f	t	\N	\N	none	1
27455	GOLOSINAS CHUPETIN C/CHICLE CERESA 24		7790580118037	179.30	300.00	-11.000	18	/uploads/7790580118037.jpg	2026-01-12 15:55:57.92422-03	2026-01-17 11:39:25.895357-03	f	\N	f	t	\N	\N	none	1
27456	GOLOSINAS CHUPETIN CRAZY POP		7798130951783	203.50	285.00	16.000	18	/uploads/7798130951783.jpg	2026-01-12 15:55:57.929439-03	2026-01-17 11:39:25.899734-03	f	\N	f	t	\N	\N	none	1
27457	GOLOSINAS CHUPETIN MISTER POPSI FRUTAL		7790580252809	90.20	150.00	5.000	18	/uploads/7790580252809.jpg	2026-01-12 15:55:57.933947-03	2026-01-17 11:39:25.902809-03	f	\N	f	t	\N	\N	none	1
27458	GOLOSINAS COFLER BLOCK X 110		77922120	0.00	0.00	0.000	18	/uploads/77922120.jpg	2026-01-12 15:55:57.938198-03	2026-01-17 11:39:25.905748-03	f	\N	f	t	\N	\N	none	1
27460	GOLOSINAS GARRAPIÑADA SERENATA X80GS		7790380014645	693.00	950.00	3.000	18	/uploads/7790380014645.jpg	2026-01-12 15:55:57.944436-03	2026-01-17 11:39:25.91089-03	f	\N	f	t	\N	\N	none	1
27461	GOLOSINAS GOMITAS CHIQUITAS X500		GOMITAS PEQUE 500 U	15.40	20.00	-164.000	18	/uploads/GOMITAS PEQUE 500 U.jpg	2026-01-12 15:55:57.946932-03	2026-01-17 11:39:25.913312-03	f	\N	f	t	\N	\N	none	1
27462	GOLOSINAS GOMITAS GOMUL CANTIDAD 214		7790580308100	28.60	50.00	-1114.000	18	/uploads/7790580308100.jpg	2026-01-12 15:55:57.949565-03	2026-01-17 11:39:25.916098-03	f	\N	f	t	\N	\N	none	1
27463	GOLOSINAS GOMITAS GOMUL DINOS		7790580116958	0.00	0.00	0.000	18	/uploads/7790580116958.jpg	2026-01-12 15:55:57.951928-03	2026-01-17 11:39:25.91899-03	f	\N	f	t	\N	\N	none	1
27465	GOLOSINAS HALLS 12 MENTHOPLUS		PASTILLAS	720.50	1000.00	-20.000	18	/uploads/PASTILLAS.jpg	2026-01-12 15:55:57.956683-03	2026-01-17 11:39:25.924351-03	f	\N	f	t	\N	\N	none	1
27466	GOLOSINAS HUEVO KINDER		78931053	2512.40	3000.00	21.000	18	/uploads/78931053.jpg	2026-01-12 15:55:57.959584-03	2026-01-17 11:39:25.928802-03	f	\N	f	t	\N	\N	none	1
27467	GOLOSINAS MALVAVISCO STICK MALLOW X32		7798178801651	170.50	250.00	29.000	18	/uploads/7798178801651.jpg	2026-01-12 15:55:57.962723-03	2026-01-17 11:39:25.932636-03	f	\N	f	t	\N	\N	none	1
27468	GOLOSINAS MALVAVISCOS GONGYS X28GS		7798186030593	198.00	250.00	-3.000	\N	/uploads/7798186030593.jpg	2026-01-12 15:55:57.965779-03	2026-01-17 11:39:25.936709-03	f	\N	f	t	\N	\N	none	1
27471	GOLOSINAS MANTECOL X110G		7622201812652	1691.80	2200.00	19.000	18	/uploads/7622201812652.jpg	2026-01-12 15:55:57.974019-03	2026-01-17 11:39:25.941934-03	f	\N	f	t	\N	\N	none	1
27472	GOLOSINAS MEDIA HORA		CARAMELOS MEDIA HORA196	19.80	34.20	1.000	18	/uploads/CARAMELOS MEDIA HORA196.jpg	2026-01-12 15:55:57.976442-03	2026-01-17 11:39:25.944463-03	f	\N	f	t	\N	\N	none	1
27473	GOLOSINAS MENTA CRISTAL		MENTA CRISTAL	3.30	4.56	1.000	18	/uploads/MENTA CRISTAL.jpg	2026-01-12 15:55:57.978779-03	2026-01-17 11:39:25.947191-03	f	\N	f	t	\N	\N	none	1
27475	GOLOSINAS MOGUL BOLSITA X 30G		7790580200114	446.60	600.00	5.000	18	/uploads/7790580200114.jpg	2026-01-12 15:55:57.984382-03	2026-01-17 11:39:25.952053-03	f	\N	f	t	\N	\N	none	1
27476	GOLOSINAS MOGUL GOMITAS		7790580602000	363.00	600.00	13.000	18	/uploads/7790580602000.jpg	2026-01-12 15:55:57.987758-03	2026-01-17 11:39:25.954661-03	f	\N	f	t	\N	\N	none	1
27477	GOLOSINAS GOMITAS MORITAS MOGUL X 79		7790580262402	83.60	100.00	147.000	18	/uploads/7790580262402.jpg	2026-01-12 15:55:57.991172-03	2026-01-17 11:39:25.95826-03	f	\N	f	t	\N	\N	none	1
27478	GOLOSINAS PASTILLAS BULL DOC X30GS		7798186030555	44.00	57.00	12.000	18	/uploads/7798186030555.jpg	2026-01-12 15:55:57.993723-03	2026-01-17 11:39:25.961626-03	f	\N	f	t	\N	\N	none	1
27479	GOLOSINAS PASTILLAS REFRESCO		7790206523320	0.00	0.00	36.000	18	/uploads/7790206523320.jpg	2026-01-12 15:55:57.996171-03	2026-01-17 11:39:25.965598-03	f	\N	f	t	\N	\N	none	1
27481	GOLOSINAS REFRESCO		7790206023264	49.50	68.40	12.000	18	/uploads/7790206023264.jpg	2026-01-12 15:55:58.001027-03	2026-01-17 11:39:25.973096-03	f	\N	f	t	\N	\N	none	1
27482	GOLOSINAS REFRESCOO		7790206023301	55.00	68.40	12.000	18	/uploads/7790206023301.jpg	2026-01-12 15:55:58.003327-03	2026-01-17 11:39:25.976938-03	f	\N	f	t	\N	\N	none	1
27483	GOLOSINAS REFRESOOO		7790206023325	60.50	68.40	12.000	18	/uploads/7790206023325.jpg	2026-01-12 15:55:58.006236-03	2026-01-17 11:39:25.980641-03	f	\N	f	t	\N	\N	none	1
27470	GOLOSINAS MANTECOL X 253		7622201816384	0.00	0.00	0.000	18	/uploads/7622201816384.jpg	2026-01-12 15:55:57.971561-03	2026-01-12 15:55:57.971561-03	f	\N	f	t	\N	\N	none	1
27484	GOLOSINAS RHODESIA		77995681	614.90	800.00	25.000	18	/uploads/77995681.jpg	2026-01-12 15:55:58.009782-03	2026-01-17 11:39:25.983721-03	f	\N	f	t	\N	\N	none	1
27486	GOLOSINAS TIC TAC		78600010	704.00	900.00	7.000	18	/uploads/78600010.jpg	2026-01-12 15:55:58.018895-03	2026-01-17 11:39:25.990125-03	f	\N	f	t	\N	\N	none	1
27487	GOLOSINAS TURRON ARCOR		77940131	222.20	400.00	55.000	18	/uploads/77940131.jpg	2026-01-12 15:55:58.022195-03	2026-01-17 11:39:25.993817-03	f	\N	f	t	\N	\N	none	1
27489	GOLOSINAS TURRON DE MANI C/ MIEL GEORGALOS X 280G		7790380034131	0.00	0.00	0.000	18	/uploads/7790380034131.jpg	2026-01-12 15:55:58.030919-03	2026-01-17 11:39:26.00078-03	f	\N	f	t	\N	\N	none	1
27490	GOLOSINAS TURRON MISKY		77940148	0.00	0.00	20.000	18	/uploads/77940148.jpg	2026-01-12 15:55:58.035126-03	2026-01-17 11:39:26.00456-03	f	\N	f	t	\N	\N	none	1
27488	GOLOSINAS TURRON DE MANI BLANDO GEORGALOS X 130GS		7790380003267	612.00	3037.50	1.000	18	/uploads/7790380003267.jpg	2026-01-12 15:55:58.026115-03	2026-01-12 15:55:58.026115-03	f	\N	f	t	\N	\N	none	1
27492	HELADOS BOMBOM CROCANTE		7798152490703	45.00	192.38	-7.000	43	/uploads/7798152490703.jpg	2026-01-12 15:55:58.042448-03	2026-01-12 15:55:58.042448-03	f	\N	f	t	\N	\N	none	1
27493	HELADOS BOMOBOM		7798152490697	40.00	153.90	39.000	43	/uploads/7798152490697.jpg	2026-01-12 15:55:58.046521-03	2026-01-12 15:55:58.046521-03	f	\N	f	t	\N	\N	none	1
27494	HELADOS HELADO FUSION		7798152490116	30.00	654.08	35.000	43	/uploads/7798152490116.jpg	2026-01-12 15:55:58.049155-03	2026-01-12 15:55:58.049155-03	f	\N	f	t	\N	\N	none	1
27496	LACTEOS CASA CREAM X 290		7791337003361	4109.60	4200.00	1.000	26	/uploads/7791337003361.jpg	2026-01-12 15:55:58.054458-03	2026-01-17 11:39:26.012809-03	f	\N	f	t	\N	\N	none	1
27498	LACTEOS CREMA X 200		2782742770103	2142.80	2700.00	10.000	26	/uploads/2782742770103.jpg	2026-01-12 15:55:58.060832-03	2026-01-17 11:39:26.018498-03	f	\N	f	t	\N	\N	none	1
27499	LACTEOS CREMA X 330		7790742771100	2634.50	3000.00	0.000	26	/uploads/7790742771100.jpg	2026-01-12 15:55:58.064859-03	2026-01-17 11:39:26.021372-03	f	\N	f	t	\N	\N	none	1
27501	LACTEOS FINLANDIA   X 180 G		7790742325808	0.00	0.00	0.000	\N	/uploads/7790742325808.jpg	2026-01-12 15:55:58.070478-03	2026-01-17 11:39:26.027557-03	f	\N	f	t	\N	\N	none	1
27503	LACTEOS LECHE DESCREMADA		7790742034915	1519.10	1750.00	5.000	26	/uploads/7790742034915.jpg	2026-01-12 15:55:58.075319-03	2026-01-17 11:39:26.032302-03	f	\N	f	t	\N	\N	none	1
27504	LACTEOS LECHE ENTERA LA S		7793940448003	1452.00	1800.00	14.000	26	/uploads/7793940448003.jpg	2026-01-12 15:55:58.077995-03	2026-01-17 11:39:26.034998-03	f	\N	f	t	\N	\N	none	1
27505	LACTEOS LEVADURA FRESCA SUELTA X 100GS		7791218123690	5610.00	8000.00	0.030	26	/uploads/7791218123690.jpg	2026-01-12 15:55:58.080463-03	2026-01-17 11:39:26.038011-03	f	\N	f	t	\N	\N	none	1
27506	LACTEOS MANTECA  LS X 100G		7790742034526	1716.00	2350.00	-12.000	26	/uploads/7790742034526.jpg	2026-01-12 15:55:58.08375-03	2026-01-17 11:39:26.04052-03	f	\N	f	t	\N	\N	none	1
27507	LACTEOS MANTECA TONADITA 100G		7798060852648	1303.50	1700.00	-10.000	21	/uploads/7798060852648.jpg	2026-01-12 15:55:58.088101-03	2026-01-17 11:39:26.042954-03	f	\N	f	t	\N	\N	none	1
27509	LACTEOS RICOTA GARCIA LA SERENISIMA		7790742102805	3608.00	4000.00	1.000	26	/uploads/7790742102805.jpg	2026-01-12 15:55:58.097223-03	2026-01-17 11:39:26.048399-03	f	\N	f	t	\N	\N	none	1
27510	LACTEOS SALCHICHAS 214 X6		7796804017162	1405.80	1900.00	4.000	26	/uploads/7796804017162.jpg	2026-01-12 15:55:58.101436-03	2026-01-17 11:39:26.051077-03	f	\N	f	t	\N	\N	none	1
27511	LACTEOS YOGUR  FIRME FRUTILLA X190		7791337004146	2543.20	3000.00	5.000	26	/uploads/7791337004146.jpg	2026-01-12 15:55:58.105691-03	2026-01-17 11:39:26.054189-03	f	\N	f	t	\N	\N	none	1
27512	LATAS CHAMPIÑONES  X 400G		7791885004025	2761.00	3500.00	2.000	47	/uploads/7791885004025.jpg	2026-01-12 15:55:58.109774-03	2026-01-17 11:39:26.057955-03	f	\N	f	t	\N	\N	none	1
27513	LATAS CHAMPIÑONES LAMINADOS		7791885004032	2274.80	2800.00	3.000	47	/uploads/7791885004032.jpg	2026-01-12 15:55:58.113453-03	2026-01-17 11:39:26.060633-03	f	\N	f	t	\N	\N	none	1
27515	MASCOTA PEDIGREE ADULTO 21K		ALIMENTO PARA MASCOTAS	2486.00	3100.00	-34.730	28	/uploads/ALIMENTO PARA MASCOTAS.jpg	2026-01-12 15:55:58.11981-03	2026-01-17 11:39:26.066582-03	f	\N	f	t	\N	\N	none	1
27516	MASCOTA PEDIGREE CACHORRO 21K		ALIMENTO MASCOTA	2634.50	3300.00	-51.368	15	/uploads/ALIMENTO MASCOTA.jpg	2026-01-12 15:55:58.123327-03	2026-01-17 11:39:26.069898-03	f	\N	f	t	\N	\N	none	1
27517	MASCOTA PIEDRAS ABSORSOL PREMIUM		7795628000022	1543.30	2000.00	4.000	15	/uploads/7795628000022.jpg	2026-01-12 15:55:58.126894-03	2026-01-17 11:39:26.073144-03	f	\N	f	t	\N	\N	none	1
27518	MASCOTA GATO WHISKAS X10K		ALIMENTO GATO	4031.50	5100.00	-5.404	15	/uploads/ALIMENTO GATO.jpg	2026-01-12 15:55:58.130182-03	2026-01-17 11:39:26.076125-03	f	\N	f	t	\N	\N	none	1
27519	MASCOTAS PIEDRITAS SANITARIAS 4.5K		7798182780034	0.00	0.00	1.000	28	/uploads/7798182780034.jpg	2026-01-12 15:55:58.133995-03	2026-01-17 11:39:26.079554-03	f	\N	f	t	\N	\N	none	1
27522	PAPEL FELPITA HIGIENICO  DE 30MTS		7791828000046	1497.10	1900.00	5.000	31	/uploads/7791828000046.jpg	2026-01-12 15:55:58.144273-03	2026-01-17 11:39:26.089389-03	f	\N	f	t	\N	\N	none	1
27523	PAPEL FELPITA HIGIENICO DE 80 MTS		7791828000657	3165.80	3950.00	1.000	31	/uploads/7791828000657.jpg	2026-01-12 15:55:58.147717-03	2026-01-17 11:39:26.091921-03	f	\N	f	t	\N	\N	none	1
27524	PAPEL FELPITA ROLLO INDIVIDUALES		7791828900148	181.50	250.80	3.000	31	/uploads/7791828900148.jpg	2026-01-12 15:55:58.152536-03	2026-01-17 11:39:26.094633-03	f	\N	f	t	\N	\N	none	1
27525	PAPEL HIG ELEGANTE  6X30		111122224444555	0.00	0.00	10.000	31	\N	2026-01-12 15:55:58.157189-03	2026-01-17 11:39:26.097753-03	f	\N	f	t	\N	\N	none	1
27526	PAPEL HIGENICO FLORIPEL		7791828000596	1128.60	1500.00	-7.000	31	/uploads/7791828000596.jpg	2026-01-12 15:55:58.160787-03	2026-01-17 11:39:26.100308-03	f	\N	f	t	\N	\N	none	1
27528	PAPEL VUAL		7798130889178	514.80	700.00	19.000	31	/uploads/7798130889178.jpg	2026-01-12 15:55:58.168007-03	2026-01-17 11:39:26.111689-03	f	\N	f	t	\N	\N	none	1
27529	PAPEL MAXI ROLLO FELPITA		7791828900377	1487.20	2000.00	2.000	31	/uploads/7791828900377.jpg	2026-01-12 15:55:58.170826-03	2026-01-17 11:39:26.116605-03	f	\N	f	t	\N	\N	none	1
27530	PAPEL PAEL COCINA DICHA X 3		7793344004300	1076.90	1600.00	7.000	31	/uploads/7793344004300.jpg	2026-01-12 15:55:58.173187-03	2026-01-17 11:39:26.12191-03	f	\N	f	t	\N	\N	none	1
27531	PAPEL PAPEL ALUMINIO		PAPEL ALU	1657.70	2100.00	10.000	31	/uploads/PAPEL ALU.jpg	2026-01-12 15:55:58.175584-03	2026-01-17 11:39:26.127397-03	f	\N	f	t	\N	\N	none	1
27532	PAPEL PAPEL ELEGANTE X80		7793344904228	3015.10	3600.00	3.000	31	/uploads/7793344904228.jpg	2026-01-12 15:55:58.177934-03	2026-01-17 11:39:26.132506-03	f	\N	f	t	\N	\N	none	1
27534	PAPEL ROLLO COCINA CELESTIAL		7791070002959	220.00	307.80	6.000	31	/uploads/7791070002959.jpg	2026-01-12 15:55:58.183266-03	2026-01-17 11:39:26.142627-03	f	\N	f	t	\N	\N	none	1
27535	PAPEL ROLLO COCINA ELEGANTE		7793344009206	1718.20	2200.00	3.000	31	/uploads/7793344009206.jpg	2026-01-12 15:55:58.186569-03	2026-01-17 11:39:26.14578-03	f	\N	f	t	\N	\N	none	1
27536	PAPEL ROLLO COCINA FELPITA		7791828000138	1497.10	1950.00	14.000	31	/uploads/7791828000138.jpg	2026-01-12 15:55:58.190148-03	2026-01-17 11:39:26.148503-03	f	\N	f	t	\N	\N	none	1
27537	PAPEL ROLLO COCINA NEW PEL COLORS		7792409000073	1342.00	1900.00	2.000	31	/uploads/7792409000073.jpg	2026-01-12 15:55:58.193362-03	2026-01-17 11:39:26.151103-03	f	\N	f	t	\N	\N	none	1
27539	PEGAMENTOS LA GOTITA		77917188	1567.50	2200.00	0.000	38	/uploads/77917188.jpg	2026-01-12 15:55:58.198909-03	2026-01-17 11:39:26.15786-03	f	\N	f	t	\N	\N	none	1
27540	PEGAMENTOS POXI RAN		7794122013071	3014.00	3600.00	2.000	38	/uploads/7794122013071.jpg	2026-01-12 15:55:58.201201-03	2026-01-17 11:39:26.161412-03	f	\N	f	t	\N	\N	none	1
27541	PEGAMENTOS SHAMPOO DOVE		7791293042213	2860.00	3700.00	1.000	33	/uploads/7791293042213.jpg	2026-01-12 15:55:58.203405-03	2026-01-17 11:39:26.164064-03	f	\N	f	t	\N	\N	none	1
27542	PERFUMERIA ABLANDADOR DE CANAS		7798126720010	44.00	62.70	3.000	33	/uploads/7798126720010.jpg	2026-01-12 15:55:58.205776-03	2026-01-17 11:39:26.166648-03	f	\N	f	t	\N	\N	none	1
27544	PERFUMERIA ACONDICIONADOR  DAAVE 1 POTE		7791293041407	676.50	969.00	3.000	33	/uploads/7791293041407.jpg	2026-01-12 15:55:58.211146-03	2026-01-17 11:39:26.17147-03	f	\N	f	t	\N	\N	none	1
27545	PERFUMERIA ALCOHOL		7790139003807	0.00	0.00	1.000	33	/uploads/7790139003807.jpg	2026-01-12 15:55:58.213451-03	2026-01-17 11:39:26.174334-03	f	\N	f	t	\N	\N	none	1
27546	PERFUMERIA ALGODON		7790064000261	748.00	1200.00	-1.000	33	/uploads/7790064000261.jpg	2026-01-12 15:55:58.216065-03	2026-01-17 11:39:26.177548-03	f	\N	f	t	\N	\N	none	1
27547	PERFUMERIA ALGODON DONCELLA		7790940003034	660.00	1000.00	1.000	33	/uploads/7790940003034.jpg	2026-01-12 15:55:58.218609-03	2026-01-17 11:39:26.181067-03	f	\N	f	t	\N	\N	none	1
27548	PERFUMERIA ANTI AMARILLOS		7798126724322	77.00	111.72	3.000	33	/uploads/7798126724322.jpg	2026-01-12 15:55:58.221038-03	2026-01-17 11:39:26.184698-03	f	\N	f	t	\N	\N	none	1
27550	PERFUMERIA CARITAS SAPHIRUS		7798184684156	1870.00	2800.00	9.000	33	/uploads/7798184684156.jpg	2026-01-12 15:55:58.225824-03	2026-01-17 11:39:26.192496-03	f	\N	f	t	\N	\N	none	1
27551	PERFUMERIA CEPILLO COLGATE		6910021007206	917.40	1400.00	8.000	33	/uploads/6910021007206.jpg	2026-01-12 15:55:58.228412-03	2026-01-17 11:39:26.196989-03	f	\N	f	t	\N	\N	none	1
27552	PERFUMERIA COLGATE DENTRIFICO HERBAL X70		7793100112225	1907.40	2700.00	7.000	33	/uploads/7793100112225.jpg	2026-01-12 15:55:58.231076-03	2026-01-17 11:39:26.199707-03	f	\N	f	t	\N	\N	none	1
27553	PERFUMERIA CREMA HINDS X 125ML		7794640172489	2200.00	2800.00	6.000	33	/uploads/7794640172489.jpg	2026-01-12 15:55:58.233904-03	2026-01-17 11:39:26.203339-03	f	\N	f	t	\N	\N	none	1
27592	PERFUMERIA SHAMPU SUAVE X 930ML		7791293040530	132.00	2370.00	10.000	33	/uploads/7791293040530.jpg	2026-01-12 15:55:58.383688-03	2026-01-17 11:39:26.370057-03	f	\N	f	t	\N	\N	none	1
27555	PERFUMERIA ALGABO QUITA ESMALTE		7790416066426	896.50	1400.00	3.000	33	/uploads/7790416066426.jpg	2026-01-12 15:55:58.239191-03	2026-01-17 11:39:26.212686-03	f	\N	f	t	\N	\N	none	1
27556	PERFUMERIA DOVE AEROSOL HOMBRE		7791293022819	277.20	775.20	3.000	33	/uploads/7791293022819.jpg	2026-01-12 15:55:58.24143-03	2026-01-17 11:39:26.217466-03	f	\N	f	t	\N	\N	none	1
27557	PERFUMERIA DESODORANTE  REXONA ODORONO		77974457	1716.00	2200.00	-10.000	33	/uploads/77974457.jpg	2026-01-12 15:55:58.243737-03	2026-01-17 11:39:26.221747-03	f	\N	f	t	\N	\N	none	1
27558	PERFUMERIA DESODORANTE CIEL		7791600032241	0.00	0.00	0.000	33	/uploads/7791600032241.jpg	2026-01-12 15:55:58.24608-03	2026-01-17 11:39:26.226423-03	f	\N	f	t	\N	\N	none	1
27559	PERFUMERIA DESODORANTE DOVE		78937697	1809.50	2220.00	1.000	33	/uploads/78937697.jpg	2026-01-12 15:55:58.249609-03	2026-01-17 11:39:26.231068-03	f	\N	f	t	\N	\N	none	1
27561	PERFUMERIA DESODORANTES AXE		094404362895	2805.00	3950.00	0.000	33	/uploads/094404362895.jpg	2026-01-12 15:55:58.256202-03	2026-01-17 11:39:26.240511-03	f	\N	f	t	\N	\N	none	1
27564	PERFUMERIA GEL FIJADOR SWING		7791905023517	0.00	0.00	0.000	33	/uploads/7791905023517.jpg	2026-01-12 15:55:58.265365-03	2026-01-17 11:39:26.245112-03	f	\N	f	t	\N	\N	none	1
27566	PERFUMERIA JABON  TOCADOR LUX		7791293037653	880.00	1200.00	5.000	33	/uploads/7791293037653.jpg	2026-01-12 15:55:58.27041-03	2026-01-17 11:39:26.253623-03	f	\N	f	t	\N	\N	none	1
27567	PERFUMERIA JABON ESPADOL DETTOL		7798339190075	1288.10	1700.00	1.920	33	/uploads/7798339190075.jpg	2026-01-12 15:55:58.272816-03	2026-01-17 11:39:26.259271-03	f	\N	f	t	\N	\N	none	1
27568	PERFUMERIA JABON TOADOR NIVEA		7908772898340	1100.00	1300.00	1.000	33	/uploads/7908772898340.jpg	2026-01-12 15:55:58.275168-03	2026-01-17 11:39:26.264295-03	f	\N	f	t	\N	\N	none	1
27569	PERFUMERIA JABON DOVE		7891150057470	1538.90	2300.00	58.000	33	/uploads/7891150057470.jpg	2026-01-12 15:55:58.277618-03	2026-01-17 11:39:26.268363-03	f	\N	f	t	\N	\N	none	1
27571	PERFUMERIA JABON TOCADOR PLUSBELLE		7790990587744	869.00	1100.00	4.000	33	/uploads/7790990587744.jpg	2026-01-12 15:55:58.283696-03	2026-01-17 11:39:26.275595-03	f	\N	f	t	\N	\N	none	1
27572	PERFUMERIA JABON CUPIDO TOCADOR X3		7791293038056	827.20	1100.00	2.000	33	/uploads/7791293038056.jpg	2026-01-12 15:55:58.28631-03	2026-01-17 11:39:26.280198-03	f	\N	f	t	\N	\N	none	1
27573	PERFUMERIA NAFTALINA ANTIPOLILLA IBERIA		7790900004767	132.00	342.00	11.000	33	/uploads/7790900004767.jpg	2026-01-12 15:55:58.28865-03	2026-01-17 11:39:26.287887-03	f	\N	f	t	\N	\N	none	1
27574	PERFUMERIA OB ORIGINAL  8 TAMPONES		7891010245566	0.00	0.00	1.000	33	/uploads/7891010245566.jpg	2026-01-12 15:55:58.291006-03	2026-01-17 11:39:26.293847-03	f	\N	f	t	\N	\N	none	1
27576	PERFUMERIA OFF CREMA X 200G		7790520012173	0.00	0.00	3.000	33	/uploads/7790520012173.jpg	2026-01-12 15:55:58.296972-03	2026-01-17 11:39:26.302434-03	f	\N	f	t	\N	\N	none	1
27562	PERFUMERIA DESODORANTES DOVE		7506306241183	200.00	6075.00	2.000	33	/uploads/7506306241183.jpg	2026-01-12 15:55:58.259862-03	2026-01-12 15:55:58.259862-03	f	\N	f	t	\N	\N	none	1
27563	PERFUMERIA DOVE		7791293040028	0.00	0.00	1.000	33	/uploads/7791293040028.jpg	2026-01-12 15:55:58.262748-03	2026-01-12 15:55:58.262748-03	f	\N	f	t	\N	\N	none	1
27577	PERFUMERIA OFF CREM X 60G		77900302	2519.00	5000.00	3.000	33	/uploads/77900302.jpg	2026-01-12 15:55:58.299511-03	2026-01-17 11:39:26.307094-03	f	\N	f	t	\N	\N	none	1
27578	PERFUMERIA PANTENE RESTAURACION SHAMPOO ACONDICIONADOR		7500435155724..	179.30	300.00	-80.000	33	/uploads/7500435155724...jpg	2026-01-12 15:55:58.346475-03	2026-01-17 11:39:26.310817-03	f	\N	f	t	\N	\N	none	1
27579	PERFUMERIA PAÑALES HUGGIES		7794626010903	2035.00	3000.00	7.000	33	/uploads/7794626010903.jpg	2026-01-12 15:55:58.349092-03	2026-01-17 11:39:26.314741-03	f	\N	f	t	\N	\N	none	1
27581	PERFUMERIA PAÑUELOS DUPEX X1 $20		7798049448640	77.00	111.72	3.000	33	/uploads/7798049448640.jpg	2026-01-12 15:55:58.353577-03	2026-01-17 11:39:26.32135-03	f	\N	f	t	\N	\N	none	1
27582	PERFUMERIA PRESTOBARBA MINORA , BIC		7506309878164	110.00	400.00	-40.000	33	/uploads/7506309878164.jpg	2026-01-12 15:55:58.35628-03	2026-01-17 11:39:26.324493-03	f	\N	f	t	\N	\N	none	1
27583	PERFUMERIA PROTECTOR DIARIO NOSOTRAS NORMAL X 20		7790770600519	1122.00	1400.00	3.000	33	/uploads/7790770600519.jpg	2026-01-12 15:55:58.360543-03	2026-01-17 11:39:26.328509-03	f	\N	f	t	\N	\N	none	1
27584	PERFUMERIA SAPHIRUS AEROSOL X 250 ML		7798184680462	3773.00	5700.00	72.000	33	/uploads/7798184680462.jpg	2026-01-12 15:55:58.363273-03	2026-01-17 11:39:26.332623-03	f	\N	f	t	\N	\N	none	1
27586	PERFUMERIA SAPHIRUS MINI AROMATIZADOR AUTOS		7798184682725	1595.00	2400.00	-2.000	33	/uploads/7798184682725.jpg	2026-01-12 15:55:58.36835-03	2026-01-17 11:39:26.341177-03	f	\N	f	t	\N	\N	none	1
27587	PERFUMERIA SAPHIRUS ROUTE 66		7798184684293	2036.10	3100.00	8.000	33	/uploads/7798184684293.jpg	2026-01-12 15:55:58.370691-03	2026-01-17 11:39:26.345578-03	f	\N	f	t	\N	\N	none	1
27588	PERFUMERIA SEDAL X300		7791293043333	2640.00	3600.00	-3.000	33	/uploads/7791293043333.jpg	2026-01-12 15:55:58.373245-03	2026-01-17 11:39:26.350653-03	f	\N	f	t	\N	\N	none	1
27589	PERFUMERIA SHAMPOO DOVE 180MI		7891150054844	2200.00	3200.00	1.000	33	/uploads/7891150054844.jpg	2026-01-12 15:55:58.37566-03	2026-01-17 11:39:26.355647-03	f	\N	f	t	\N	\N	none	1
27590	PERFUMERIA SHAMPOO PLUSBELLE		PLUSBELLE SHAMPOO	0.00	0.00	1.000	33	/uploads/PLUSBELLE SHAMPOO.jpg	2026-01-12 15:55:58.378111-03	2026-01-17 11:39:26.359962-03	f	\N	f	t	\N	\N	none	1
27593	PERFUMERIA TINTURA ISSUE		7793008001775	2568.50	3150.00	78.000	33	/uploads/7793008001775.jpg	2026-01-12 15:55:58.387451-03	2026-01-17 11:39:26.375284-03	f	\N	f	t	\N	\N	none	1
27594	PERFUMERIA TOALLITAS  LINA X 16		7794626996771	0.00	0.00	0.000	33	/uploads/7794626996771.jpg	2026-01-12 15:55:58.391761-03	2026-01-17 11:39:26.380731-03	f	\N	f	t	\N	\N	none	1
27595	PERFUMERIA TOALLITAS HUMEDAS HUGGIES		7794626007170	4034.80	4700.00	5.000	33	/uploads/7794626007170.jpg	2026-01-12 15:55:58.396292-03	2026-01-17 11:39:26.386788-03	f	\N	f	t	\N	\N	none	1
27598	PERFUMERIA TOALLITAS LINA  X 8		7794626996764	823.90	1300.00	32.000	33	/uploads/7794626996764.jpg	2026-01-12 15:55:58.409859-03	2026-01-17 11:39:26.392072-03	f	\N	f	t	\N	\N	none	1
27600	PERFUMERIA TOALLITAS KOTEX		7793620003249	0.00	0.00	0.000	33	/uploads/7793620003249.jpg	2026-01-12 15:55:58.417412-03	2026-01-17 11:39:26.39703-03	f	\N	f	t	\N	\N	none	1
27603	PERFUMERIA TOLLITAS LADYSOFT		7790250097396	63.80	111.72	1.000	33	/uploads/7790250097396.jpg	2026-01-12 15:55:58.427345-03	2026-01-17 11:39:26.408392-03	f	\N	f	t	\N	\N	none	1
27604	POLLO MILANESA DE POLLO		POLLOOOO	6050.00	7500.00	-7.580	48	\N	2026-01-12 15:55:58.430585-03	2026-01-17 11:39:26.412632-03	f	\N	f	t	\N	\N	none	1
27605	POLLO PATA MUSLO		POLLOOO	2750.00	3500.00	10.640	48	\N	2026-01-12 15:55:58.434318-03	2026-01-17 11:39:26.417051-03	f	\N	f	t	\N	\N	none	1
27606	CONGELADOS RICOSAURIOS X 1/4		CONGELADOS	6985.00	9500.00	0.990	17	/uploads/CONGELADOS.jpg	2026-01-12 15:55:58.437857-03	2026-01-17 11:39:26.421658-03	f	\N	f	t	\N	\N	none	1
27607	POLLO SUPREMA		SUPRRMA ..	5368.00	7000.00	12.650	48	/uploads/SUPRRMA ...jpg	2026-01-12 15:55:58.441442-03	2026-01-17 11:39:26.426688-03	f	\N	f	t	\N	\N	none	1
27608	PRODUCTOS SUELTOS CHIPS DE CHOCOLATES		112	7667.00	11000.00	-2.361	46	/uploads/112.jpg	2026-01-12 15:55:58.444815-03	2026-01-17 11:39:26.431238-03	f	\N	f	t	\N	\N	none	1
27610	PRODUCTOS SUELTOS PILAS ENERGIZER TRIPLE AAA X 1		8999002672068	766.70	1000.00	-25.000	29	/uploads/8999002672068.jpg	2026-01-12 15:55:58.453539-03	2026-01-17 11:39:26.440087-03	f	\N	f	t	\N	\N	none	1
27597	PERFUMERIA TOALLITAS LADYSOFT		7790250096788	0.00	0.00	0.000	33	/uploads/7790250096788.jpg	2026-01-12 15:55:58.40563-03	2026-01-12 15:55:58.40563-03	f	\N	f	t	\N	\N	none	1
27599	PERFUMERIA TOALLITAS NOSOTRAS		7702026195830	0.00	0.00	0.000	33	/uploads/7702026195830.jpg	2026-01-12 15:55:58.414033-03	2026-01-12 15:55:58.414033-03	f	\N	f	t	\N	\N	none	1
27602	PERFUMERIA TOALLITAS PROTECTORES  LINA		7794626995958	771.00	3712.50	-1.000	33	/uploads/7794626995958.jpg	2026-01-12 15:55:58.423893-03	2026-01-12 15:55:58.423893-03	f	\N	f	t	\N	\N	none	1
27612	VERDULERIA ACELAGA		556VERDULERIA	770.00	950.00	-1.000	27	/uploads/556VERDULERIA.jpg	2026-01-12 15:55:58.461565-03	2026-01-17 11:39:26.449561-03	f	\N	f	t	\N	\N	none	1
27613	VERDULERIA AJOOO		VERDURA.	440.00	700.00	55.000	27	/uploads/VERDURA..jpg	2026-01-12 15:55:58.465048-03	2026-01-17 11:39:26.455918-03	f	\N	f	t	\N	\N	none	1
27614	VERDULERIA ALBAHACA		VERDU	1100.00	1300.00	2.000	27	/uploads/VERDU.jpg	2026-01-12 15:55:58.468324-03	2026-01-17 11:39:26.460574-03	f	\N	f	t	\N	\N	none	1
27615	VERDULERIA APIO		558VERDULERIA X100G	550.00	6800.00	0.470	27	\N	2026-01-12 15:55:58.470772-03	2026-01-17 11:39:26.464601-03	f	\N	f	t	\N	\N	none	1
27616	VERDULERIA BANANA ECUADOR		446FRUTAS B	2588.30	3350.00	-8.278	27	/uploads/446FRUTAS B.jpg	2026-01-12 15:55:58.473061-03	2026-01-17 11:39:26.470116-03	f	\N	f	t	\N	\N	none	1
27618	VERDULERIA BERENJENA		VERDURAA B 690	1100.00	1500.00	1.069	27	/uploads/VERDURAA B 690.jpg	2026-01-12 15:55:58.477868-03	2026-01-17 11:39:26.480796-03	f	\N	f	t	\N	\N	none	1
27619	VERDULERIA BROCOLI		VERDURASS B	367.40	513.00	1.000	27	/uploads/VERDURASS B.jpg	2026-01-12 15:55:58.480679-03	2026-01-17 11:39:26.487497-03	f	\N	f	t	\N	\N	none	1
27620	VERDULERIA CEBOLLA MORADA		24242	786.50	1000.00	4.760	27	/uploads/24242.jpg	2026-01-12 15:55:58.484291-03	2026-01-17 11:39:26.493124-03	f	\N	f	t	\N	\N	none	1
27621	VERDULERIA CEBOLLA		VERDULERIA.. 602	647.90	900.00	12.190	27	/uploads/VERDULERIA.. 602.jpg	2026-01-12 15:55:58.488925-03	2026-01-17 11:39:26.498336-03	f	\N	f	t	\N	\N	none	1
27623	VERDULERIA CHOCLO		VERDURASCHO	407.00	550.00	18.000	27	/uploads/VERDURASCHO.jpg	2026-01-12 15:55:58.495268-03	2026-01-17 11:39:26.509105-03	f	\N	f	t	\N	\N	none	1
27624	VERDULERIA CIRUELA		1111222	308.00	649.80	12.000	27	/uploads/1111222.jpg	2026-01-12 15:55:58.497796-03	2026-01-17 11:39:26.515642-03	f	\N	f	t	\N	\N	none	1
27626	VERDULERIA ESPINACA		651VERDULERIA	458.70	900.00	9.000	27	/uploads/651VERDULERIA.jpg	2026-01-12 15:55:58.502385-03	2026-01-17 11:39:26.520862-03	f	\N	f	t	\N	\N	none	1
27627	VERDULERIA JENGIBRE X100G		VERDULERIA J	1650.00	3420.00	1.000	27	/uploads/VERDULERIA J.jpg	2026-01-12 15:55:58.504645-03	2026-01-17 11:39:26.525677-03	f	\N	f	t	\N	\N	none	1
27629	VERDULERIA LIMON		VERDURAS L 499	4400.00	5000.00	11.380	27	/uploads/VERDURAS L 499.jpg	2026-01-12 15:55:58.511355-03	2026-01-17 11:39:26.542709-03	f	\N	f	t	\N	\N	none	1
27630	VERDULERIA MANDARINA		FRUTAS M	1815.00	2300.00	27.250	27	/uploads/FRUTAS M.jpg	2026-01-12 15:55:58.515154-03	2026-01-17 11:39:26.549539-03	f	\N	f	t	\N	\N	none	1
27631	VERDULERIA MANGO		VERDULERIA M	82.50	108.30	4.000	27	/uploads/VERDULERIA M.jpg	2026-01-12 15:55:58.520771-03	2026-01-17 11:39:26.557667-03	f	\N	f	t	\N	\N	none	1
27632	VERDULERIA MANZANA ROJA GAUCHO		FRUTAS MA	5176.60	6400.00	5.826	27	/uploads/FRUTAS MA.jpg	2026-01-12 15:55:58.528769-03	2026-01-17 11:39:26.56636-03	f	\N	f	t	\N	\N	none	1
27633	VERDULERIA MANZANA VERDE		1122	1947.00	2450.00	0.050	27	/uploads/1122.jpg	2026-01-12 15:55:58.533149-03	2026-01-17 11:39:26.570897-03	f	\N	f	t	\N	\N	none	1
27635	VERDULERIA MORRON ROJO		VERDURAA 671	1784.20	2500.00	2.402	27	/uploads/VERDURAA 671.jpg	2026-01-12 15:55:58.541609-03	2026-01-17 11:39:26.579737-03	f	\N	f	t	\N	\N	none	1
27636	VERDULERIA NARANJA OMBLIGO		11122	1036.20	1300.00	27.480	27	/uploads/11122.jpg	2026-01-12 15:55:58.546676-03	2026-01-17 11:39:26.587671-03	f	\N	f	t	\N	\N	none	1
27625	VERDULERIA DURAZNO		VERDULER.DURA	2450.00	11137.50	-31.426	27	/uploads/VERDULER.DURA.jpg	2026-01-12 15:55:58.500169-03	2026-01-12 15:55:58.500169-03	f	\N	f	t	\N	\N	none	1
27637	VERDULERIA PALTA		VERDULERIA P	887.70	1200.00	10.000	27	/uploads/VERDULERIA P.jpg	2026-01-12 15:55:58.551692-03	2026-01-17 11:39:26.593146-03	f	\N	f	t	\N	\N	none	1
27638	VERDULERIA PAPAS BLANCA		VERDULERIAAA	770.00	1100.00	10.650	27	/uploads/VERDULERIAAA.jpg	2026-01-12 15:55:58.556802-03	2026-01-17 11:39:26.599011-03	f	\N	f	t	\N	\N	none	1
27640	VERDULERIA PEPINO		VERDURAS PEPIN	1375.00	1800.00	8246.720	27	/uploads/VERDURAS PEPIN.jpg	2026-01-12 15:55:58.565378-03	2026-01-17 11:39:26.610777-03	f	\N	f	t	\N	\N	none	1
27641	VERDULERIA PERA		VERDULERIA PER	3423.20	4200.00	-0.330	27	/uploads/VERDULERIA PER.jpg	2026-01-12 15:55:58.569412-03	2026-01-17 11:39:26.615326-03	f	\N	f	t	\N	\N	none	1
27642	VERDULERIA PIÑA		VERDULERIAAAA	187.00	250.80	7.000	27	/uploads/VERDULERIAAAA.jpg	2026-01-12 15:55:58.574094-03	2026-01-17 11:39:26.620186-03	f	\N	f	t	\N	\N	none	1
27643	VERDULERIA POMELO ROJO		VERDULERIAAAAAAAAA	110.00	136.80	12.000	27	\N	2026-01-12 15:55:58.57822-03	2026-01-17 11:39:26.626028-03	f	\N	f	t	\N	\N	none	1
27644	VERDULERIA RADICHETA		674VERDURAS	550.00	750.00	6.000	27	\N	2026-01-12 15:55:58.582188-03	2026-01-17 11:39:26.630972-03	f	\N	f	t	\N	\N	none	1
27645	VERDULERIA REMOLACHA		VERDURA   X	1650.00	2000.00	1.410	27	/uploads/VERDURA   X.jpg	2026-01-12 15:55:58.58553-03	2026-01-17 11:39:26.635733-03	f	\N	f	t	\N	\N	none	1
27647	VERDULERIA RUCULA		675VERDURAS RUC	550.00	750.00	3.000	27	/uploads/675VERDURAS RUC.jpg	2026-01-12 15:55:58.591318-03	2026-01-17 11:39:26.645852-03	f	\N	f	t	\N	\N	none	1
27648	VERDULERIA TOMATE CHERRI X1/4		VERDUULLEE	682.00	1000.00	0.360	27	/uploads/VERDUULLEE.jpg	2026-01-12 15:55:58.593979-03	2026-01-17 11:39:26.651362-03	f	\N	f	t	\N	\N	none	1
27649	VERDULERIA TOMATE PERITA		VERDUPERITA	2200.00	2500.00	10.000	27	\N	2026-01-12 15:55:58.596439-03	2026-01-17 11:39:26.656056-03	f	\N	f	t	\N	\N	none	1
27650	VERDULERIA TOMATES REDONDOS		684VERDURAS	2588.30	3500.00	15.550	27	/uploads/684VERDURAS.jpg	2026-01-12 15:55:58.598831-03	2026-01-17 11:39:26.660893-03	f	\N	f	t	\N	\N	none	1
27651	VERDULERIA UVA ROSADA		112222	3905.00	5000.00	2.700	27	/uploads/112222.jpg	2026-01-12 15:55:58.601106-03	2026-01-17 11:39:26.666126-03	f	\N	f	t	\N	\N	none	1
27652	VERDULERIA ZANAHORIA		VERDURAS ZA	1925.00	2400.00	7.302	27	/uploads/VERDURAS ZA.jpg	2026-01-12 15:55:58.603351-03	2026-01-17 11:39:26.671528-03	f	\N	f	t	\N	\N	none	1
27654	VERDULERIA ZAPALLO ANCO BATATA		VERDURAS.	990.00	1500.00	18.250	27	/uploads/VERDURAS..jpg	2026-01-12 15:55:58.608749-03	2026-01-17 11:39:26.682429-03	f	\N	f	t	\N	\N	none	1
27655	VERDULERIA ZAPALLO CABUTIA		VERDU CA	1210.00	1500.00	12.960	27	/uploads/VERDU CA.jpg	2026-01-12 15:55:58.611156-03	2026-01-17 11:39:26.687355-03	f	\N	f	t	\N	\N	none	1
27656	VERDULERIA ZUQUINI		VERDULERIA ZU	66.00	180.12	1.000	27	/uploads/VERDULERIA ZU.jpg	2026-01-12 15:55:58.613479-03	2026-01-17 11:39:26.692606-03	f	\N	f	t	\N	\N	none	1
27657	VERDULERIA 🍓 FRUTILLA X BANDEJA		VERDULERIA F	1100.00	3000.00	2.690	27	/uploads/VERDULERIA F.jpg	2026-01-12 15:55:58.615997-03	2026-01-17 11:39:26.697615-03	f	\N	f	t	\N	\N	none	1
27658	GALLETITAS PURITOS		7792684000591	898.70	1200.00	3.000	25	/uploads/7792684000591.jpg	2026-01-12 15:55:58.618417-03	2026-01-17 11:39:26.706914-03	f	\N	f	t	\N	\N	none	1
27659	ART.LIMPIEZA ODEX ANTI GRASA		ODEX12345	141.90	193.80	3.000	29	\N	2026-01-12 15:55:58.620942-03	2026-01-17 11:39:26.70995-03	f	\N	f	t	\N	\N	none	1
27661	ALMACEN ANIS EN GRANO ALICANTE		7790150420331	814.00	1000.00	9.000	21	/uploads/7790150420331.jpg	2026-01-12 15:55:58.625576-03	2026-01-17 11:39:26.716399-03	f	\N	f	t	\N	\N	none	1
27662	VERDULERIA ANANA  FRUTA		176539	0.00	0.00	0.000	\N	\N	2026-01-12 15:55:58.627985-03	2026-01-17 11:39:26.720217-03	f	\N	f	t	\N	\N	none	1
27663	ALMACEN PAN DULCE C/CHIPS BENJAMIN		7790907000717	2033.90	2600.00	0.000	21	/uploads/7790907000717.jpg	2026-01-12 15:55:58.630252-03	2026-01-17 11:39:26.723988-03	f	\N	f	t	\N	\N	none	1
27664	BODEGA SAN FELIPE		7790577000024	2145.00	3009.60	3.000	37	/uploads/7790577000024.jpg	2026-01-12 15:55:58.63257-03	2026-01-17 11:39:26.728563-03	f	\N	f	t	\N	\N	none	1
27665	PAPEL ROLLO COCINA X 3 CARTABELA		7791828000626	1203.40	1600.00	1.000	31	/uploads/7791828000626.jpg	2026-01-12 15:55:58.635048-03	2026-01-17 11:39:26.732958-03	f	\N	f	t	\N	\N	none	1
27666	ART.LIMPIEZA PEGAMENTO UNIPOX		7790400018585	1694.00	2100.00	3.000	29	/uploads/7790400018585.jpg	2026-01-12 15:55:58.637514-03	2026-01-17 11:39:26.737191-03	f	\N	f	t	\N	\N	none	1
27668	BODEGA CERV IGUANA		7793147572945	554.40	775.20	6.000	\N	/uploads/7793147572945.jpg	2026-01-12 15:55:58.642198-03	2026-01-17 11:39:26.746378-03	f	\N	f	t	\N	\N	none	1
27669	BODEGA CERV PALERMO		7793147572952	0.00	0.00	0.000	37	/uploads/7793147572952.jpg	2026-01-12 15:55:58.644582-03	2026-01-17 11:39:26.75061-03	f	\N	f	t	\N	\N	none	1
27670	AGUA BRIO POMELO		7798062543933	688.60	980.00	3.000	\N	/uploads/7798062543933.jpg	2026-01-12 15:55:58.647623-03	2026-01-17 11:39:26.755244-03	f	\N	f	t	\N	\N	none	1
27673	ALMACEN VARIEDADES123456		VARIOS123456	0.55	1.14	5776.710	21	/uploads/VARIOS123456.jpg	2026-01-12 15:55:58.65526-03	2026-01-17 11:39:26.767031-03	f	\N	f	t	\N	\N	none	1
27674	ALMACEN PREPIZZA		PREPIZAS12345	1210.00	1450.00	-29.000	24	/uploads/PREPIZAS12345.jpg	2026-01-12 15:55:58.657584-03	2026-01-17 11:39:26.77101-03	f	\N	f	t	\N	\N	none	1
27675	ALMACEN GARRAFA		GARRAFAS12345	15950.00	16000.00	-6.000	21	/uploads/GARRAFAS12345.jpg	2026-01-12 15:55:58.659994-03	2026-01-17 11:39:26.774099-03	f	\N	f	t	\N	\N	none	1
27677	ALMACEN PICLES X100G		PICLES12345	0.00	0.00	-0.200	21	/uploads/PICLES12345.jpg	2026-01-12 15:55:58.664581-03	2026-01-17 11:39:26.779361-03	f	\N	f	t	\N	\N	none	1
27678	ALMACEN NUEZ X 100G		NUEZ123445	16170.00	22500.00	1.720	21	/uploads/NUEZ123445.jpg	2026-01-12 15:55:58.668473-03	2026-01-17 11:39:26.78206-03	f	\N	f	t	\N	\N	none	1
27680	ALMACEN ACEITUNAS S/C OLIVARES DEL CESAR X100G		7798155560489	6196.30	8000.00	-0.040	21	/uploads/7798155560489.jpg	2026-01-12 15:55:58.675674-03	2026-01-17 11:39:26.784574-03	f	\N	f	t	\N	\N	none	1
27681	ALMACEN TOSTADAS DE GLUTEN		TOSTADAS12345	0.00	0.00	-0.250	21	/uploads/TOSTADAS12345.jpg	2026-01-12 15:55:58.678931-03	2026-01-17 11:39:26.78719-03	f	\N	f	t	\N	\N	none	1
27683	MASCOTA ESSENTIAL CORE		MASCOTAS12345	1080.20	1450.00	-13.010	15	/uploads/MASCOTAS12345.jpg	2026-01-12 15:55:58.688063-03	2026-01-17 11:39:26.791794-03	f	\N	f	t	\N	\N	none	1
27684	BODEGA CERVEZA LATA SALTA ROJA		7793147572389	260.70	353.40	6.000	37	/uploads/7793147572389.jpg	2026-01-12 15:55:58.69146-03	2026-01-17 11:39:26.794564-03	f	\N	f	t	\N	\N	none	1
27685	BODEGA CERVEZA LATA SALTA BLEND		7793147572570	260.70	353.40	6.000	37	/uploads/7793147572570.jpg	2026-01-12 15:55:58.694271-03	2026-01-17 11:39:26.797989-03	f	\N	f	t	\N	\N	none	1
27687	GALLETITAS PEPAS CLASS X 350		7791386000335	0.00	0.00	0.000	25	/uploads/7791386000335.jpg	2026-01-12 15:55:58.699776-03	2026-01-17 11:39:26.803983-03	f	\N	f	t	\N	\N	none	1
27688	GALLETITAS PEPAS TRIO CHOCO X180		7791787000682	544.50	750.00	13.000	25	/uploads/7791787000682.jpg	2026-01-12 15:55:58.701985-03	2026-01-17 11:39:26.806588-03	f	\N	f	t	\N	\N	none	1
27689	GALLETITAS VARIEDAD DORADAS		7622201804329	316.80	433.20	3.000	25	/uploads/7622201804329.jpg	2026-01-12 15:55:58.70418-03	2026-01-17 11:39:26.809086-03	f	\N	f	t	\N	\N	none	1
27690	GALLETITAS POLVORITA FRUTILLA		7790040314207	421.30	600.00	4.000	25	/uploads/7790040314207.jpg	2026-01-12 15:55:58.706511-03	2026-01-17 11:39:26.811683-03	f	\N	f	t	\N	\N	none	1
27692	ART.LIMPIEZA MR MUSCULO VIDRIOS Y MULTYUSO		7790520018649	2640.00	3300.00	-2.000	29	/uploads/7790520018649.jpg	2026-01-12 15:55:58.713748-03	2026-01-17 11:39:26.819615-03	f	\N	f	t	\N	\N	none	1
27693	ART.LIMPIEZA VIVERE CLASICO		7791290010482	2420.00	3000.00	15.000	29	/uploads/7791290010482.jpg	2026-01-12 15:55:58.716259-03	2026-01-17 11:39:26.823588-03	f	\N	f	t	\N	\N	none	1
27694	ALMACEN FIDEO LUCCHETI SPAGHETI		7790070318282	0.00	0.00	0.000	21	/uploads/7790070318282.jpg	2026-01-12 15:55:58.718627-03	2026-01-17 11:39:26.827205-03	f	\N	f	t	\N	\N	none	1
27679	PERFUMERIA TOALLITAS CALIPSO CON ALAS		7790770601004	600.00	3712.50	-5.000	33	/uploads/7790770601004.jpg	2026-01-12 15:55:58.672129-03	2026-01-12 15:55:58.672129-03	f	\N	f	t	\N	\N	none	1
27695	ALMACEN FIDEO LUCCHETTI BUCATINI		7790070318305	0.00	0.00	0.000	21	/uploads/7790070318305.jpg	2026-01-12 15:55:58.720936-03	2026-01-17 11:39:26.829907-03	f	\N	f	t	\N	\N	none	1
27696	ALMACEN FIDEO LUCCHETTI TIRABUZON		7790070318329	0.00	0.00	0.000	21	/uploads/7790070318329.jpg	2026-01-12 15:55:58.723275-03	2026-01-17 11:39:26.832451-03	f	\N	f	t	\N	\N	none	1
27698	BEBIDA JUGOS DE VIDRIO		JUGOS123456	660.00	1003.20	20.000	19	/uploads/JUGOS123456.jpg	2026-01-12 15:55:58.728546-03	2026-01-17 11:39:26.838635-03	f	\N	f	t	\N	\N	none	1
27699	ALMACEN ACEITE MOLTO		7798138552616	0.00	0.00	0.000	21	/uploads/7798138552616.jpg	2026-01-12 15:55:58.731824-03	2026-01-17 11:39:26.841061-03	f	\N	f	t	\N	\N	none	1
27700	MASCOTA ALIMENTO ESENTIAL CORE X K		ALIMENTO PER123456	0.00	0.00	20.000	28	/uploads/ALIMENTO PER123456.jpg	2026-01-12 15:55:58.736168-03	2026-01-17 11:39:26.843377-03	f	\N	f	t	\N	\N	none	1
27701	MASCOTAS ALIMENTO NUTRIBON GATO		ALIMENTOGATO1234	1728.10	2300.00	6.900	28	/uploads/ALIMENTOGATO1234.jpg	2026-01-12 15:55:58.740291-03	2026-01-17 11:39:26.846105-03	f	\N	f	t	\N	\N	none	1
27703	ALMACEN ACEITE PUREZA 900		7792180137937	0.00	0.00	0.000	21	/uploads/7792180137937.jpg	2026-01-12 15:55:58.749306-03	2026-01-17 11:39:26.851041-03	f	\N	f	t	\N	\N	none	1
27704	ALMACEN OKEBON AVENA Y PASAS		7790263119641	1568.60	2000.00	5.000	21	/uploads/7790263119641.jpg	2026-01-12 15:55:58.752725-03	2026-01-17 11:39:26.853429-03	f	\N	f	t	\N	\N	none	1
27705	BEBIDA CEPITA BOTELLA 1 L		7790895009815	2161.50	2600.00	-2.000	44	/uploads/7790895009815.jpg	2026-01-12 15:55:58.756222-03	2026-01-17 11:39:26.856759-03	f	\N	f	t	\N	\N	none	1
27706	GASEOSAS CRUSH		7790895006951	1100.00	1300.00	1.000	49	/uploads/7790895006951.jpg	2026-01-12 15:55:58.760383-03	2026-01-17 11:39:26.86096-03	f	\N	f	t	\N	\N	none	1
27708	PERFUMERIA SHAMPU DAAVE 1 POTE		7791293045436	522.50	706.80	3.000	33	/uploads/7791293045436.jpg	2026-01-12 15:55:58.767471-03	2026-01-17 11:39:26.871109-03	f	\N	f	t	\N	\N	none	1
27709	ALMACEN MOSTAZA DANICA X 60G		7791620187273	337.70	700.00	18.000	21	/uploads/7791620187273.jpg	2026-01-12 15:55:58.770564-03	2026-01-17 11:39:26.876494-03	f	\N	f	t	\N	\N	none	1
27710	ART.LIMPIEZA ART.LIM JABON PALMOLIVE		7509546675046	663.30	900.00	12.000	29	/uploads/7509546675046.jpg	2026-01-12 15:55:58.773989-03	2026-01-17 11:39:26.881534-03	f	\N	f	t	\N	\N	none	1
27711	GALLETITAS BARRITAS CON MEMBRILLO		7791324157619	539.00	660.00	0.000	25	/uploads/7791324157619.jpg	2026-01-12 15:55:58.777328-03	2026-01-17 11:39:26.886375-03	f	\N	f	t	\N	\N	none	1
27713	BEBIDA SCHWEPPES SIN AZUCAR		7790895010095	420.20	570.00	6.000	19	/uploads/7790895010095.jpg	2026-01-12 15:55:58.784002-03	2026-01-17 11:39:26.892456-03	f	\N	f	t	\N	\N	none	1
27714	GOLOSINAS CARAMELOS MENTA CHOCO		7790580118273	12.10	28.50	133.000	18	/uploads/7790580118273.jpg	2026-01-12 15:55:58.787448-03	2026-01-17 11:39:26.895492-03	f	\N	f	t	\N	\N	none	1
27715	ALMACEN ARROZ MOLINOS ALA X 1KG		7791120031557	1090.10	2000.00	6.000	21	/uploads/7791120031557.jpg	2026-01-12 15:55:58.790958-03	2026-01-17 11:39:26.899822-03	f	\N	f	t	\N	\N	none	1
27718	ALMACEN CEREAL FORT GRANRICO		77909039	476.30	700.00	22.000	21	/uploads/77909039.jpg	2026-01-12 15:55:58.801279-03	2026-01-17 11:39:26.905805-03	f	\N	f	t	\N	\N	none	1
27719	ALMACEN LENTEJAS ADENOMAR		7790279001121	1104.40	1400.00	-8.000	21	/uploads/7790279001121.jpg	2026-01-12 15:55:58.806479-03	2026-01-17 11:39:26.909415-03	f	\N	f	t	\N	\N	none	1
27720	ALMACEN MAIZ PISINGALLO		7790279000278	646.80	900.00	9.000	21	/uploads/7790279000278.jpg	2026-01-12 15:55:58.810429-03	2026-01-17 11:39:26.912842-03	f	\N	f	t	\N	\N	none	1
27721	BODEGA BIECKERT		7793147572907	343.20	461.70	6.000	37	/uploads/7793147572907.jpg	2026-01-12 15:55:58.813869-03	2026-01-17 11:39:26.916545-03	f	\N	f	t	\N	\N	none	1
27723	GOLOSINAS CARAMELOS BILLIKEN		7792222004012	5.50	17.10	122.000	18	/uploads/7792222004012.jpg	2026-01-12 15:55:58.821105-03	2026-01-17 11:39:26.924312-03	f	\N	f	t	\N	\N	none	1
27724	GOLOSINAS GOMITAS MISKY  EUCALIPTUS (MENTA) 180 UNIDADES		7790580222109	37.40	50.00	-149.000	18	/uploads/7790580222109.jpg	2026-01-12 15:55:58.823649-03	2026-01-17 11:39:26.927155-03	f	\N	f	t	\N	\N	none	1
27725	FIAMBRERIA PALETA CERDO		2829275	8147.70	12000.00	3.850	20	/uploads/2829275.jpg	2026-01-12 15:55:58.825944-03	2026-01-17 11:39:26.929571-03	f	\N	f	t	\N	\N	none	1
27726	ALMACEN YOGUR CLASICO X 1 LTS LS		7791337605510	2120.80	2600.00	14.000	21	/uploads/7791337605510.jpg	2026-01-12 15:55:58.82826-03	2026-01-17 11:39:26.931874-03	f	\N	f	t	\N	\N	none	1
27728	PERFUMERIA POLYANA MEN SPORT		7791905004202	481.80	1100.00	3.000	33	/uploads/7791905004202.jpg	2026-01-12 15:55:58.833998-03	2026-01-17 11:39:26.937634-03	f	\N	f	t	\N	\N	none	1
27729	PERFUMERIA REXONA INVISIBLE 72HS		7791293045184	435.60	2000.00	1.000	33	/uploads/7791293045184.jpg	2026-01-12 15:55:58.838834-03	2026-01-17 11:39:26.941354-03	f	\N	f	t	\N	\N	none	1
27716	ART.LIMPIEZA DETERGENTE MAGISTRAL X 500ML DE		7500435216487	0.00	0.00	4.000	29	/uploads/7500435216487.jpg	2026-01-12 15:55:58.794266-03	2026-01-12 15:55:58.794266-03	f	\N	f	t	\N	\N	none	1
27731	PERFUMERIA POLYANA WOOD		7791905022794	269.50	1400.00	3.000	33	/uploads/7791905022794.jpg	2026-01-12 15:55:58.846291-03	2026-01-17 11:39:26.948912-03	f	\N	f	t	\N	\N	none	1
27732	PERFUMERIA PATRICHS  DESODORANTE		7791293046815	404.80	1300.00	4.000	33	/uploads/7791293046815.jpg	2026-01-12 15:55:58.850429-03	2026-01-17 11:39:26.951661-03	f	\N	f	t	\N	\N	none	1
27734	ALMACEN QUESO RAYADO LA QUESERA X 40G		7792882000201	580.80	800.00	-8.000	21	/uploads/7792882000201.jpg	2026-01-12 15:55:58.858134-03	2026-01-17 11:39:26.956732-03	f	\N	f	t	\N	\N	none	1
27735	MASCOTAS EXCELLENT		ALIMENTOEXCELLENT	8181.80	9700.00	10.210	28	/uploads/ALIMENTOEXCELLENT.jpg	2026-01-12 15:55:58.86153-03	2026-01-17 11:39:26.959344-03	f	\N	f	t	\N	\N	none	1
27736	BODEGA SANTA FILOMENA CHICO		7798008400481	1756.70	2200.00	0.000	37	/uploads/7798008400481.jpg	2026-01-12 15:55:58.86393-03	2026-01-17 11:39:26.961757-03	f	\N	f	t	\N	\N	none	1
27737	AGUA AQUARIUS X1½		7790895640483	0.00	0.00	0.000	23	/uploads/7790895640483.jpg	2026-01-12 15:55:58.866275-03	2026-01-17 11:39:26.964207-03	f	\N	f	t	\N	\N	none	1
27738	AGUA AQUARIUS POMELO 1½		7790895640490	0.00	0.00	0.000	23	/uploads/7790895640490.jpg	2026-01-12 15:55:58.86864-03	2026-01-17 11:39:26.967-03	f	\N	f	t	\N	\N	none	1
27740	GOLOSINAS TURIMAR TRI CHOCO		77910080	88.00	148.20	5.000	18	/uploads/77910080.jpg	2026-01-12 15:55:58.873374-03	2026-01-17 11:39:26.972071-03	f	\N	f	t	\N	\N	none	1
27741	PERFUMERIA TALCO ALGABO PIES. X200		ALGABOOOOOOOO	1400.30	1850.00	0.000	33	/uploads/ALGABOOOOOOOO.jpg	2026-01-12 15:55:58.875697-03	2026-01-17 11:39:26.974405-03	f	\N	f	t	\N	\N	none	1
27742	ALMACEN MANI CON CHOCOLATE		MANICONCHOCOLATE111	16665.00	23000.00	1.570	21	/uploads/MANICONCHOCOLATE111.jpg	2026-01-12 15:55:58.878058-03	2026-01-17 11:39:26.977238-03	f	\N	f	t	\N	\N	none	1
27743	FARMACIA NEXT		650240010538	414.70	700.00	-1.000	30	/uploads/650240010538.jpg	2026-01-12 15:55:58.880294-03	2026-01-17 11:39:26.979707-03	f	\N	f	t	\N	\N	none	1
27745	CONDIMENTOS CONDIM PAA PESCADOS		7790150495339	149.60	205.20	2.000	14	/uploads/7790150495339.jpg	2026-01-12 15:55:58.886124-03	2026-01-17 11:39:26.984949-03	f	\N	f	t	\N	\N	none	1
27747	ALMACEN HARINA CASERITA 000		7792590000159	603.90	850.00	2.000	21	/uploads/7792590000159.jpg	2026-01-12 15:55:58.890881-03	2026-01-17 11:39:26.987479-03	f	\N	f	t	\N	\N	none	1
27748	ALMACEN ARROZ CAROGRAN X500		7793650000041	440.00	700.00	-5.000	21	/uploads/7793650000041.jpg	2026-01-12 15:55:58.893144-03	2026-01-17 11:39:26.989836-03	f	\N	f	t	\N	\N	none	1
27749	GOLOSINAS LA YAPA		77904744	187.00	300.00	-1.000	18	/uploads/77904744.jpg	2026-01-12 15:55:58.89546-03	2026-01-17 11:39:26.992091-03	f	\N	f	t	\N	\N	none	1
27750	GALLETITAS PEPAS GLASI		7791787000651	0.00	0.00	0.000	25	/uploads/7791787000651.jpg	2026-01-12 15:55:58.898083-03	2026-01-17 11:39:26.994449-03	f	\N	f	t	\N	\N	none	1
27752	GALLETITAS CLASICAS MARINERAS. G&M		7798035770205	132.00	205.20	6.000	25	/uploads/7798035770205.jpg	2026-01-12 15:55:58.902706-03	2026-01-17 11:39:27.001055-03	f	\N	f	t	\N	\N	none	1
27753	GALLETITAS PEPAS  CLASS		7791386000816	0.00	0.00	0.000	25	/uploads/7791386000816.jpg	2026-01-12 15:55:58.904877-03	2026-01-17 11:39:27.003709-03	f	\N	f	t	\N	\N	none	1
27754	ALMACEN ROSCA PASCUA		ROSCA11111	0.00	0.00	0.000	21	/uploads/ROSCA11111.jpg	2026-01-12 15:55:58.907292-03	2026-01-17 11:39:27.006355-03	f	\N	f	t	\N	\N	none	1
27756	ALMACEN CAPUCCINO LA VIR		7790150160725	2950.20	3700.00	5.000	21	/uploads/7790150160725.jpg	2026-01-12 15:55:58.912336-03	2026-01-17 11:39:27.011232-03	f	\N	f	t	\N	\N	none	1
27758	ALMACEN LA CUMBRECITA NARANJA		7790217000070	0.00	0.00	0.000	21	/uploads/7790217000070.jpg	2026-01-12 15:55:58.919312-03	2026-01-17 11:39:27.01962-03	f	\N	f	t	\N	\N	none	1
27759	GALLETITAS MARINERAS G&M 5 SEMILLAS		7798035771578	154.00	216.60	4.000	25	/uploads/7798035771578.jpg	2026-01-12 15:55:58.922238-03	2026-01-17 11:39:27.023398-03	f	\N	f	t	\N	\N	none	1
27760	GALLETITAS MARINERAS G&M SIN SAL		7798035770243	154.00	216.60	1.000	25	/uploads/7798035770243.jpg	2026-01-12 15:55:58.924523-03	2026-01-17 11:39:27.027286-03	f	\N	f	t	\N	\N	none	1
27762	ALMACEN TOMATE CANALE		7798100661407	132.00	182.40	12.000	21	/uploads/7798100661407.jpg	2026-01-12 15:55:58.929724-03	2026-01-17 11:39:27.032517-03	f	\N	f	t	\N	\N	none	1
27746	ALMACEN ACEITE CORAZON GIRASOL		7798085454513	1354.00	7425.00	-4.000	21	/uploads/7798085454513.jpg	2026-01-12 15:55:58.888608-03	2026-01-12 15:55:58.888608-03	f	\N	f	t	\N	\N	none	1
27763	CHOCOLATES MISKY X50G		7790580327910	618.20	850.00	4.000	32	/uploads/7790580327910.jpg	2026-01-12 15:55:58.934989-03	2026-01-17 11:39:27.034999-03	f	\N	f	t	\N	\N	none	1
27764	GALLETITAS TALITAS DON SATUR		7795735000106	0.00	0.00	0.000	25	/uploads/7795735000106.jpg	2026-01-12 15:55:58.939468-03	2026-01-17 11:39:27.037918-03	f	\N	f	t	\N	\N	none	1
27766	GALLETITAS MANA RELLENAS		7790040133242	253.00	330.60	6.000	25	/uploads/7790040133242.jpg	2026-01-12 15:55:58.947553-03	2026-01-17 11:39:27.044064-03	f	\N	f	t	\N	\N	none	1
27767	GALLETITAS CLUB SOCIAL ORIGINAL		7622300990732	379.50	500.00	25.000	25	/uploads/7622300990732.jpg	2026-01-12 15:55:58.951084-03	2026-01-17 11:39:27.047021-03	f	\N	f	t	\N	\N	none	1
27768	ALMACEN VITINA CLASICAS		7790070318879	1012.00	1250.00	3.000	21	/uploads/7790070318879.jpg	2026-01-12 15:55:58.953741-03	2026-01-17 11:39:27.049346-03	f	\N	f	t	\N	\N	none	1
27769	ALMACEN FILTRO DE CAFE		7790150811061	0.00	1200.00	0.000	21	/uploads/7790150811061.jpg	2026-01-12 15:55:58.956308-03	2026-01-17 11:39:27.052466-03	f	\N	f	t	\N	\N	none	1
27770	ALMACEN KETCHUP DANICA  X250		7791620187242	1125.30	1500.00	3.000	21	/uploads/7791620187242.jpg	2026-01-12 15:55:58.959787-03	2026-01-17 11:39:27.056055-03	f	\N	f	t	\N	\N	none	1
27772	INSUMO CAMICETA 30/40		INSUMONSBOLSA	440.00	456.00	3.000	50	/uploads/INSUMONSBOLSA.jpg	2026-01-12 15:55:58.966583-03	2026-01-17 11:39:27.063041-03	f	\N	f	t	\N	\N	none	1
27757	ART VARIOS FILTRO PARA BOMBILLA		7798030841740	197.00	1856.25	5.000	39	/uploads/7798030841740.jpg	2026-01-12 15:55:58.916065-03	2026-01-12 15:55:58.916065-03	f	\N	f	t	\N	\N	none	1
27773	INSUMO BOLSA CARAMELO 15/20		INSIMOROLLO	880.00	1800.00	2.000	50	/uploads/INSIMOROLLO.jpg	2026-01-12 15:55:58.969156-03	2026-01-17 11:39:27.066341-03	f	\N	f	t	\N	\N	none	1
27774	INSUMO BOLSA DE ARRANQUE 25/35		7794459002533	1540.00	4000.00	2.000	50	/uploads/7794459002533.jpg	2026-01-12 15:55:58.97146-03	2026-01-17 11:39:27.06879-03	f	\N	f	t	\N	\N	none	1
27775	INSUMO BOLSA ARRNQUE 20/30		7794459002526	1320.00	3200.00	1.000	50	/uploads/7794459002526.jpg	2026-01-12 15:55:58.973729-03	2026-01-17 11:39:27.071098-03	f	\N	f	t	\N	\N	none	1
27777	BODEGA SOL X330		7793147001216	368.50	513.00	6.000	37	/uploads/7793147001216.jpg	2026-01-12 15:55:58.979449-03	2026-01-17 11:39:27.076372-03	f	\N	f	t	\N	\N	none	1
27780	ART.LIMPIEZA SKIP LIQUIDO PARA DILUIR		7791290793217	388.30	524.40	3.000	29	/uploads/7791290793217.jpg	2026-01-12 15:55:58.98866-03	2026-01-17 11:39:27.079782-03	f	\N	f	t	\N	\N	none	1
27782	CHOCOLATES SHOT X90		7791249451656	2134.00	2650.00	1.000	32	/uploads/7791249451656.jpg	2026-01-12 15:55:58.99564-03	2026-01-17 11:39:27.086056-03	f	\N	f	t	\N	\N	none	1
27783	ALMACEN PAPEL MNTECA		790757822252	1296.90	1820.00	1.000	21	/uploads/790757822252.jpg	2026-01-12 15:55:58.99899-03	2026-01-17 11:39:27.088449-03	f	\N	f	t	\N	\N	none	1
27788	FARMACIA SOLUCION  PISIOLOGICA COPEA		7798110210572	448.80	850.00	6.000	30	/uploads/7798110210572.jpg	2026-01-12 15:55:59.058874-03	2026-01-17 11:39:27.093996-03	f	\N	f	t	\N	\N	none	1
27778	BODEGA HEINEKEN A		7793147009137	0.00	0.00	0.000	37	/uploads/7793147009137.jpg	2026-01-12 15:55:58.981805-03	2026-01-12 15:55:58.981805-03	f	\N	f	t	\N	\N	none	1
27779	PERFUMERIA DOVE SACHESITO		7791293042459	22.00	506.25	14.000	33	/uploads/7791293042459.jpg	2026-01-12 15:55:58.985064-03	2026-01-12 15:55:58.985064-03	f	\N	f	t	\N	\N	none	1
27784	LACTEOS MANTECA PREMIO X200		7798085370080	404.00	2423.93	4.000	26	/uploads/7798085370080.jpg	2026-01-12 15:55:59.003104-03	2026-01-12 15:55:59.003104-03	f	\N	f	t	\N	\N	none	1
27785	BODEGA HEINEQUEN SIN ALCOHOL		7793147572808	0.00	0.00	0.000	37	/uploads/7793147572808.jpg	2026-01-12 15:55:59.006219-03	2026-01-12 15:55:59.006219-03	f	\N	f	t	\N	\N	none	1
27786	FARMACIA REFRIANEX		7795378001263	0.00	0.00	0.000	30	/uploads/7795378001263.jpg	2026-01-12 15:55:59.010069-03	2026-01-12 15:55:59.010069-03	f	\N	f	t	\N	\N	none	1
27791	PERFUMERIA TAMPONES SUPER		7702026194697	2348.50	2900.00	-9.000	33	/uploads/7702026194697.jpg	2026-01-12 15:55:59.068849-03	2026-01-17 11:39:27.104024-03	f	\N	f	t	\N	\N	none	1
27792	ALMACEN MIEL LAS CUATRO ESQUINAS		763571806319	0.00	0.00	0.000	21	/uploads/763571806319.jpg	2026-01-12 15:55:59.071333-03	2026-01-17 11:39:27.107572-03	f	\N	f	t	\N	\N	none	1
27793	ALMACEN LENTEJAS INCA		7790790124293	611.60	850.00	7.000	21	/uploads/7790790124293.jpg	2026-01-12 15:55:59.073751-03	2026-01-17 11:39:27.113303-03	f	\N	f	t	\N	\N	none	1
27794	MASCOTAS EUKANUBA CACHORRO		PERROEUKANUBA	3584.90	4200.00	6.870	15	/uploads/PERROEUKANUBA.jpg	2026-01-12 15:55:59.076271-03	2026-01-17 11:39:27.117801-03	f	\N	f	t	\N	\N	none	1
27796	CHOCOLATES CHOCOLATIN BLANCO		77958570	53.90	102.60	20.000	32	/uploads/77958570.jpg	2026-01-12 15:55:59.081081-03	2026-01-17 11:39:27.127861-03	f	\N	f	t	\N	\N	none	1
27797	CHOCOLATES CHOCOLATIN NEGRO		77958563	53.90	171.00	20.000	32	/uploads/77958563.jpg	2026-01-12 15:55:59.084617-03	2026-01-17 11:39:27.132708-03	f	\N	f	t	\N	\N	none	1
27798	GALLETITAS REX SABOR ORIGINAL		7790040003569	886.60	1150.00	10.000	25	/uploads/7790040003569.jpg	2026-01-12 15:55:59.088184-03	2026-01-17 11:39:27.137685-03	f	\N	f	t	\N	\N	none	1
27799	GOLOSINAS ALFAJOR MILKA MOUSSE TRIPLE		77903785	0.00	0.00	0.000	18	/uploads/77903785.jpg	2026-01-12 15:55:59.092131-03	2026-01-17 11:39:27.142746-03	f	\N	f	t	\N	\N	none	1
27800	ALMACEN ALITAS POLLO		ALITAAAAA	1430.00	1600.00	0.140	21	/uploads/ALITAAAAA.jpg	2026-01-12 15:55:59.096418-03	2026-01-17 11:39:27.147583-03	f	\N	f	t	\N	\N	none	1
27802	ALMACEN TULIPAN CLACLASICO		7791014090325	1382.70	2000.00	14.000	21	/uploads/7791014090325.jpg	2026-01-12 15:55:59.104225-03	2026-01-17 11:39:27.157266-03	f	\N	f	t	\N	\N	none	1
27803	ALMACEN GUANTE EL PAR		GUANTESSS	0.00	0.00	0.000	21	/uploads/GUANTESSS.jpg	2026-01-12 15:55:59.10847-03	2026-01-17 11:39:27.161172-03	f	\N	f	t	\N	\N	none	1
27804	ALMACEN RESINITE		RESENITESSSSS	0.00	0.00	0.000	21	\N	2026-01-12 15:55:59.112657-03	2026-01-17 11:39:27.165416-03	f	\N	f	t	\N	\N	none	1
27805	CIGARRILLOS RED POINT X20		77974907	1732.50	2200.00	46.000	51	/uploads/77974907.jpg	2026-01-12 15:55:59.116567-03	2026-01-17 11:39:27.169201-03	f	\N	f	t	\N	\N	none	1
27807	ALMACEN ARROZ MARIA X500		7790387070026	0.00	0.00	0.000	21	/uploads/7790387070026.jpg	2026-01-12 15:55:59.123485-03	2026-01-17 11:39:27.172258-03	f	\N	f	t	\N	\N	none	1
27809	MASCOTAS NUTRIBON PERRO ADULTO		MASCOTASS	0.00	0.00	0.000	28	/uploads/MASCOTASS.jpg	2026-01-12 15:55:59.130377-03	2026-01-17 11:39:27.178303-03	f	\N	f	t	\N	\N	none	1
27810	MASCOTAS CONEJIN		CONEJINNNN	139.70	500.00	19.400	28	/uploads/CONEJINNNN.jpg	2026-01-12 15:55:59.134431-03	2026-01-17 11:39:27.181985-03	f	\N	f	t	\N	\N	none	1
27811	MASCOTAS ARROZ PARA PERRO X15K		MASCOTASSSS	873.40	1300.00	-40.040	28	/uploads/MASCOTASSSS.jpg	2026-01-12 15:55:59.138352-03	2026-01-17 11:39:27.185793-03	f	\N	f	t	\N	\N	none	1
27812	MASCOTAS PEDIGREE RAZA PEQUEÑA		MASCOTAA	0.00	0.00	0.000	28	/uploads/MASCOTAA.jpg	2026-01-12 15:55:59.14173-03	2026-01-17 11:39:27.1903-03	f	\N	f	t	\N	\N	none	1
27814	ALMACEN PAPAS PAY GOOD SHOW X100G		7798112605222	0.00	0.00	0.000	21	/uploads/7798112605222.jpg	2026-01-12 15:55:59.148546-03	2026-01-17 11:39:27.198462-03	f	\N	f	t	\N	\N	none	1
27815	ALMACEN ROCKLER		ROCKLERRRR	12243.00	16700.00	0.540	21	/uploads/ROCKLERRRR.jpg	2026-01-12 15:55:59.151805-03	2026-01-17 11:39:27.200977-03	f	\N	f	t	\N	\N	none	1
27816	ALMACEN PASAS DE UVA		PASASSDEUVAAA	3795.00	6500.00	-0.040	21	/uploads/PASASSDEUVAAA.jpg	2026-01-12 15:55:59.154916-03	2026-01-17 11:39:27.20528-03	f	\N	f	t	\N	\N	none	1
27817	ALMACEN COCO X100G		COCOOOOO	9383.00	12800.00	1.035	21	/uploads/COCOOOOO.jpg	2026-01-12 15:55:59.158564-03	2026-01-17 11:39:27.208409-03	f	\N	f	t	\N	\N	none	1
27819	MASCOTAS BALANCED SENIOR DOG		MASCOTAS01	1161.60	4800.00	12.000	28	/uploads/MASCOTAS01.jpg	2026-01-12 15:55:59.16784-03	2026-01-17 11:39:27.213986-03	f	\N	f	t	\N	\N	none	1
27820	GOLOSINAS ALFAJOR TOFI SIMPLE		7790040116610	399.30	650.00	18.000	25	/uploads/7790040116610.jpg	2026-01-12 15:55:59.171202-03	2026-01-17 11:39:27.216828-03	f	\N	f	t	\N	\N	none	1
27806	ALMACEN HUEVO BLANCO X 1/2		HUEVOOO	0.00	0.00	0.000	21	/uploads/HUEVOOO.jpg	2026-01-12 15:55:59.120075-03	2026-01-12 15:55:59.120075-03	f	\N	f	t	\N	\N	none	1
27821	ALMACEN TOSTADAS DE ARROZ ALA X150G		7791120098093	1001.00	1300.00	-5.000	21	/uploads/7791120098093.jpg	2026-01-12 15:55:59.17397-03	2026-01-17 11:39:27.220904-03	f	\N	f	t	\N	\N	none	1
27822	ALMACEN TOSTADAS DE ARROZ LEIVA LINO Y CHIA		7790412001629	0.00	0.00	0.000	21	/uploads/7790412001629.jpg	2026-01-12 15:55:59.176654-03	2026-01-17 11:39:27.223373-03	f	\N	f	t	\N	\N	none	1
27823	ALMACEN TOSTADAS DULCES LEIVA		7790412000288	742.50	1000.00	0.000	21	/uploads/7790412000288.jpg	2026-01-12 15:55:59.179419-03	2026-01-17 11:39:27.226145-03	f	\N	f	t	\N	\N	none	1
27825	MASCOTAS PROPLAN RAZA PEQUEÑA		MASCOTASSS22	7176.40	8800.00	-24.600	28	/uploads/MASCOTASSS22.jpg	2026-01-12 15:55:59.185107-03	2026-01-17 11:39:27.232942-03	f	\N	f	t	\N	\N	none	1
27826	MASCOTAS DOG SELECTION ADULTO X 21 K		MASCOTASSSS123	1820.50	2408.00	2.490	28	/uploads/MASCOTASSSS123.jpg	2026-01-12 15:55:59.188519-03	2026-01-17 11:39:27.23656-03	f	\N	f	t	\N	\N	none	1
27827	UNIDAD GOLOSINAS CHICLE BAZOOKA      80 UNIDADES		7622201803070	70.40	100.00	92.000	18	/uploads/7622201803070.jpg	2026-01-12 15:55:59.19245-03	2026-01-17 11:39:27.239196-03	f	\N	f	t	\N	\N	none	1
27828	GOLOSINAS CARAMELOS CREMINO		7790580110208	25.30	60.00	66.000	18	/uploads/7790580110208.jpg	2026-01-12 15:55:59.19629-03	2026-01-17 11:39:27.24218-03	f	\N	f	t	\N	\N	none	1
27832	ALMACEN CHICITOS LEQ X160		7797429010811	0.00	0.00	-1.000	21	/uploads/7797429010811.jpg	2026-01-12 15:55:59.208829-03	2026-01-17 11:39:27.247304-03	f	\N	f	t	\N	\N	none	1
27833	ALMACEN CHICITOS DE COLORES X150		7797429007071	0.00	0.00	0.000	21	/uploads/7797429007071.jpg	2026-01-12 15:55:59.211945-03	2026-01-17 11:39:27.249736-03	f	\N	f	t	\N	\N	none	1
27834	ALMACEN YERBA KURUPI		7840127000124	1320.00	1960.80	3.000	21	/uploads/7840127000124.jpg	2026-01-12 15:55:59.214892-03	2026-01-17 11:39:27.252439-03	f	\N	f	t	\N	\N	none	1
27836	ALMACEN MERMELADA FRUTILLA		7795184119794	1802.90	2250.00	-2.000	21	/uploads/7795184119794.jpg	2026-01-12 15:55:59.221435-03	2026-01-17 11:39:27.25934-03	f	\N	f	t	\N	\N	none	1
27837	ALMACEN FIDEO LUCCHETTI AL HUEVO 🥚		7790070335364	0.00	0.00	0.000	21	/uploads/7790070335364.jpg	2026-01-12 15:55:59.224425-03	2026-01-17 11:39:27.262336-03	f	\N	f	t	\N	\N	none	1
27838	CONGELADOS CARITAS DE PAPAS X1/4. $3000		CONGELADOSSSS	7663.70	10500.00	2.520	17	/uploads/CONGELADOSSSS.jpg	2026-01-12 15:55:59.227071-03	2026-01-17 11:39:27.265043-03	f	\N	f	t	\N	\N	none	1
27840	ART.LIMPIEZA DETERGENTE ALA ULTRA X300		7791290794276	1346.40	1750.00	-2.000	29	/uploads/7791290794276.jpg	2026-01-12 15:55:59.231558-03	2026-01-17 11:39:27.27062-03	f	\N	f	t	\N	\N	none	1
27841	ALMACEN EXQUISITA CHOCOLATADA		7790070418012	0.00	0.00	0.000	21	/uploads/7790070418012.jpg	2026-01-12 15:55:59.234172-03	2026-01-17 11:39:27.273832-03	f	\N	f	t	\N	\N	none	1
27842	GOLOSINAS MANTECOL X64G		7622201816445	0.00	0.00	0.000	18	/uploads/7622201816445.jpg	2026-01-12 15:55:59.236512-03	2026-01-17 11:39:27.277519-03	f	\N	f	t	\N	\N	none	1
27843	ART.LIMPIEZA JABON ALA MATIC SOL		7791290792166	0.00	0.00	0.000	29	/uploads/7791290792166.jpg	2026-01-12 15:55:59.238664-03	2026-01-17 11:39:27.281027-03	f	\N	f	t	\N	\N	none	1
27844	ART.LIMPIEZA JABON ALA  EN POLVO LAVADO A MAMO		7791290792067	1279.30	1700.00	35.000	29	/uploads/7791290792067.jpg	2026-01-12 15:55:59.241629-03	2026-01-17 11:39:27.28418-03	f	\N	f	t	\N	\N	none	1
27830	ALMACEN MANTECA PREMIO X100		7798085370073	0.00	0.00	0.000	21	/uploads/7798085370073.jpg	2026-01-12 15:55:59.202441-03	2026-01-12 15:55:59.202441-03	f	\N	f	t	\N	\N	none	1
27831	ALMACEN MANTECA SANCOR X100		7790080010862	0.00	0.00	0.000	21	/uploads/7790080010862.jpg	2026-01-12 15:55:59.20554-03	2026-01-12 15:55:59.20554-03	f	\N	f	t	\N	\N	none	1
27845	ART.LIMPIEZA ESPONJA ROMI DE BRONCE		7798061890021	630.30	850.00	9.000	29	/uploads/7798061890021.jpg	2026-01-12 15:55:59.29031-03	2026-01-17 11:39:27.287387-03	f	\N	f	t	\N	\N	none	1
27847	ART.LIMPIEZA JABON CUPIDO TOCAROR		7794218106229	280.50	399.00	1.000	29	/uploads/7794218106229.jpg	2026-01-12 15:55:59.343043-03	2026-01-17 11:39:27.292481-03	f	\N	f	t	\N	\N	none	1
27849	VERDULERIA 🫐 ARANDANOS		VERDURASSSSSSS	2017.40	2500.00	4.000	27	/uploads/VERDURASSSSSSS.jpg	2026-01-12 15:55:59.351808-03	2026-01-17 11:39:27.299065-03	f	\N	f	t	\N	\N	none	1
27851	ALMACEN PEBETES X4		7798342860132	0.00	0.00	0.000	21	/uploads/7798342860132.jpg	2026-01-12 15:55:59.359995-03	2026-01-17 11:39:27.305151-03	f	\N	f	t	\N	\N	none	1
27852	ALMACEN MEDIALUNASX3		7798342860125	1694.00	2100.00	1.000	21	/uploads/7798342860125.jpg	2026-01-12 15:55:59.364053-03	2026-01-17 11:39:27.308459-03	f	\N	f	t	\N	\N	none	1
27853	CONGELADOS NUGGETS SADIA 1/4		7893000668935	774.40	1140.00	6.000	17	/uploads/7893000668935.jpg	2026-01-12 15:55:59.367749-03	2026-01-17 11:39:27.312265-03	f	\N	f	t	\N	\N	none	1
27854	BODEGA COSECHA TOINTO		7792319971173	0.00	0.00	0.000	37	/uploads/7792319971173.jpg	2026-01-12 15:55:59.371572-03	2026-01-17 11:39:27.31574-03	f	\N	f	t	\N	\N	none	1
27858	GALLETITAS VAINILLAS MAURI X 160G		7790628102639	598.40	843.60	32.000	25	/uploads/7790628102639.jpg	2026-01-12 15:55:59.387213-03	2026-01-17 11:39:27.320663-03	f	\N	f	t	\N	\N	none	1
27877	CONGELADOS BOLA DE LOMO		CARNICERIAAAAAA	7900.00	26662.50	3.460	17	\N	2026-01-12 15:55:59.462384-03	2026-01-12 15:55:59.462384-03	f	\N	f	t	\N	\N	none	1
27859	CONGELADOS CARRE DE CERDO		CARNICERIAAAA	5720.00	8500.00	1.880	17	/uploads/CARNICERIAAAA.jpg	2026-01-12 15:55:59.3924-03	2026-01-17 11:39:27.323229-03	f	\N	f	t	\N	\N	none	1
27861	CONGELADOS FILE DE MERLUZA		PESCADERIA	1870.00	3078.00	9.000	17	/uploads/PESCADERIA.jpg	2026-01-12 15:55:59.400931-03	2026-01-17 11:39:27.330657-03	f	\N	f	t	\N	\N	none	1
27862	CONGELADOS MILANESA DE ESPINACA CROCANTES		7790070035981	1034.00	1447.80	3.000	17	/uploads/7790070035981.jpg	2026-01-12 15:55:59.40446-03	2026-01-17 11:39:27.333878-03	f	\N	f	t	\N	\N	none	1
27863	ALMACEN PAN DULCE S/F DON SATUR		PANDULCESINFRUTAS	2897.40	3500.00	21.000	21	\N	2026-01-12 15:55:59.407524-03	2026-01-17 11:39:27.33738-03	f	\N	f	t	\N	\N	none	1
27864	ALMACEN BUDIN S/F DON SATUR		BUDINS/FDONSATUR	0.00	0.00	0.000	21	\N	2026-01-12 15:55:59.411915-03	2026-01-17 11:39:27.339891-03	f	\N	f	t	\N	\N	none	1
27865	GALLETITAS PEPAS FUTURO X170G		PEPASFUTURO	445.50	600.00	31.000	25	/uploads/PEPASFUTURO.jpg	2026-01-12 15:55:59.415587-03	2026-01-17 11:39:27.342377-03	f	\N	f	t	\N	\N	none	1
27866	GALLETITAS MARMOLADAS PARNOR		7791324156933	672.10	900.00	7.000	25	/uploads/7791324156933.jpg	2026-01-12 15:55:59.41914-03	2026-01-17 11:39:27.345049-03	f	\N	f	t	\N	\N	none	1
27867	PERFUMERIA CREMA NIVEA		4005800137679	0.00	0.00	0.000	33	/uploads/4005800137679.jpg	2026-01-12 15:55:59.422324-03	2026-01-17 11:39:27.347579-03	f	\N	f	t	\N	\N	none	1
27868	CONGELADOS CORNALITO. $600. 1/4		CORNALITOOOO	1870.00	2736.00	5.000	17	\N	2026-01-12 15:55:59.426048-03	2026-01-17 11:39:27.350096-03	f	\N	f	t	\N	\N	none	1
27870	ALMACEN JARDINERA MOLTO		7798138552937	0.00	0.00	0.000	21	/uploads/7798138552937.jpg	2026-01-12 15:55:59.43369-03	2026-01-17 11:39:27.356633-03	f	\N	f	t	\N	\N	none	1
27856	ALMACEN ACEITE COCINERO PLUS X 900		7790070231666	1400.00	7762.50	-4.000	21	/uploads/7790070231666.jpg	2026-01-12 15:55:59.378838-03	2026-01-12 15:55:59.378838-03	f	\N	f	t	\N	\N	none	1
27857	ALMACEN FRITOLIN CLASICO COCINERO		7790070228666	0.00	0.00	0.000	21	/uploads/7790070228666.jpg	2026-01-12 15:55:59.383115-03	2026-01-12 15:55:59.383115-03	f	\N	f	t	\N	\N	none	1
27871	ALMACEN TE DE TILO LA MORENITA		7790170923645	1474.00	2000.00	5.000	21	/uploads/7790170923645.jpg	2026-01-12 15:55:59.437043-03	2026-01-17 11:39:27.359981-03	f	\N	f	t	\N	\N	none	1
27872	ALMACEN TOMATE LA HUERTA X 133		7790036006727	284.90	450.00	11.000	21	/uploads/7790036006727.jpg	2026-01-12 15:55:59.440458-03	2026-01-17 11:39:27.364848-03	f	\N	f	t	\N	\N	none	1
27874	ALMACEN ÑANDECOGA. FECULA DE MADIOCA		7798035540013	2597.10	3300.00	3.000	21	/uploads/7798035540013.jpg	2026-01-12 15:55:59.449558-03	2026-01-17 11:39:27.374629-03	f	\N	f	t	\N	\N	none	1
27875	ALMACEN ÑANDECOGA HARINA DE MAIZ		7798035540020	1692.90	2200.00	0.000	21	/uploads/7798035540020.jpg	2026-01-12 15:55:59.454105-03	2026-01-17 11:39:27.379732-03	f	\N	f	t	\N	\N	none	1
27876	ALMACEN DURAZNO INCA		7790790007022	0.00	0.00	0.000	21	/uploads/7790790007022.jpg	2026-01-12 15:55:59.458747-03	2026-01-17 11:39:27.384714-03	f	\N	f	t	\N	\N	none	1
27878	ALMACEN GOOD SHOW CHICITOS		7798112003523	0.00	0.00	0.000	21	/uploads/7798112003523.jpg	2026-01-12 15:55:59.466362-03	2026-01-17 11:39:27.38987-03	f	\N	f	t	\N	\N	none	1
27880	ALMACEN ENSALADA		ENSALAD	0.00	0.00	0.000	21	/uploads/ENSALAD.jpg	2026-01-12 15:55:59.475035-03	2026-01-17 11:39:27.399644-03	f	\N	f	t	\N	\N	none	1
27881	ALMACEN ENSALADA BOLS		ENSALADA	0.00	0.00	0.000	21	/uploads/ENSALADA.jpg	2026-01-12 15:55:59.479185-03	2026-01-17 11:39:27.40362-03	f	\N	f	t	\N	\N	none	1
27882	ALMACEN PURE DE PAPAS MAMA COCINA		7792180140586	1862.30	2400.00	9.000	21	/uploads/7792180140586.jpg	2026-01-12 15:55:59.483624-03	2026-01-17 11:39:27.406327-03	f	\N	f	t	\N	\N	none	1
27883	GALLETITAS CHOCO SMAMS		7798181511011	1980.00	2000.00	0.000	25	/uploads/7798181511011.jpg	2026-01-12 15:55:59.48796-03	2026-01-17 11:39:27.409538-03	f	\N	f	t	\N	\N	none	1
27884	GALLETITAS GALLITAS DULCES DE ARROZ		7790070417237	518.10	729.60	3.000	25	/uploads/7790070417237.jpg	2026-01-12 15:55:59.492385-03	2026-01-17 11:39:27.412582-03	f	\N	f	t	\N	\N	none	1
27886	GALLETITAS SMAMS RELLENAS FRUTILLA		7798181510267	552.20	775.20	3.000	25	/uploads/7798181510267.jpg	2026-01-12 15:55:59.499774-03	2026-01-17 11:39:27.418273-03	f	\N	f	t	\N	\N	none	1
27887	ALMACEN LEDESMA SUCRALOSA		7792540293792	0.00	0.00	0.000	21	/uploads/7792540293792.jpg	2026-01-12 15:55:59.502976-03	2026-01-17 11:39:27.421272-03	f	\N	f	t	\N	\N	none	1
27889	LACTEOS LECHE LARGA VIDA		7790742308801	1617.00	1850.00	-8.000	26	/uploads/7790742308801.jpg	2026-01-12 15:55:59.512727-03	2026-01-17 11:39:27.423761-03	f	\N	f	t	\N	\N	none	1
27890	MASCOTA PACHA		MASCOTASSSSS	539.00	880.00	22.000	15	/uploads/MASCOTASSSSSSS.jpg	2026-01-12 15:55:59.516739-03	2026-01-17 11:39:27.42624-03	f	\N	f	t	\N	\N	none	1
27892	UNIDAD GOLOSINAS YUMMY GOMITAS X 12		7798186032641	337.70	500.00	7.000	18	/uploads/7798186032641.jpg	2026-01-12 15:55:59.523755-03	2026-01-17 11:39:27.431661-03	f	\N	f	t	\N	\N	none	1
27893	GALLETITAS SMAMS COCO		7798181511196	554.40	800.00	3.000	25	/uploads/7798181511196.jpg	2026-01-12 15:55:59.528051-03	2026-01-17 11:39:27.433958-03	f	\N	f	t	\N	\N	none	1
27894	GALLETITAS SMAMS PEPAS		7798181510786	1291.40	1500.00	-1.000	25	/uploads/7798181510786.jpg	2026-01-12 15:55:59.531281-03	2026-01-17 11:39:27.438736-03	f	\N	f	t	\N	\N	none	1
27895	ALMACEN AZUCAR DE MASCABO		7792540294607	793.10	889.20	3.000	21	/uploads/7792540294607.jpg	2026-01-12 15:55:59.536073-03	2026-01-17 11:39:27.442613-03	f	\N	f	t	\N	\N	none	1
27896	ART.LIMPIEZA JABON ARGENTINO		7794218106236	902.00	1500.00	-1.000	29	/uploads/7794218106236.jpg	2026-01-12 15:55:59.540194-03	2026-01-17 11:39:27.4464-03	f	\N	f	t	\N	\N	none	1
27898	ALMACEN SABOR EN POLVO ALICANTE		7790150437780	320.10	400.00	24.000	21	/uploads/7790150437780.jpg	2026-01-12 15:55:59.546196-03	2026-01-17 11:39:27.45312-03	f	\N	f	t	\N	\N	none	1
27888	PERFUMERIA TOALLITASA LINA INCONTINENCIA		7794626011764	694.00	4218.75	2.000	33	/uploads/7794626011764.jpg	2026-01-12 15:55:59.507566-03	2026-01-12 15:55:59.507566-03	f	\N	f	t	\N	\N	none	1
27899	ALMACEN MANI FRITO SALDO LE.Q		7797429010026	1097.80	1400.00	0.000	21	/uploads/7797429010026.jpg	2026-01-12 15:55:59.549285-03	2026-01-17 11:39:27.456178-03	f	\N	f	t	\N	\N	none	1
27900	ALMACEN COCO RALLADO		768731920300	377.30	535.00	2.000	21	/uploads/768731920300.jpg	2026-01-12 15:55:59.552659-03	2026-01-17 11:39:27.458704-03	f	\N	f	t	\N	\N	none	1
27903	PERFUMERIA GEL DOREE CAPILAR		7794050008750	0.00	1340.00	0.000	33	/uploads/7794050008750.jpg	2026-01-12 15:55:59.566497-03	2026-01-17 11:39:27.463332-03	f	\N	f	t	\N	\N	none	1
27904	BODEGA BODKA SKII OIGINAL		VODKAAAAAA	12096.70	13500.00	2.000	37	/uploads/VODKAAAAAA.jpg	2026-01-12 15:55:59.570617-03	2026-01-17 11:39:27.466198-03	f	\N	f	t	\N	\N	none	1
27905	LACTEOS LECHE DESCREMADA PROTEINAS		7790742358608	0.00	0.00	0.000	26	/uploads/7790742358608.jpg	2026-01-12 15:55:59.574995-03	2026-01-17 11:39:27.469531-03	f	\N	f	t	\N	\N	none	1
27906	ALMACEN SALAMIN CHAMPION		7796804032011	2589.40	3200.00	-1.000	21	/uploads/7796804032011.jpg	2026-01-12 15:55:59.578079-03	2026-01-17 11:39:27.472582-03	f	\N	f	t	\N	\N	none	1
27901	ALMACEN PAPAS LEQ X 65 ........		7797429010729	0.00	0.00	0.000	21	/uploads/7797429010729.jpg	2026-01-12 15:55:59.555817-03	2026-01-12 15:55:59.555817-03	f	\N	f	t	\N	\N	none	1
27907	ALMACEN NUEZ MOSCADA BOLSITA		NUEZZZZZXX	220.00	400.00	10.000	21	\N	2026-01-12 15:55:59.580957-03	2026-01-17 11:39:27.475836-03	f	\N	f	t	\N	\N	none	1
27909	ALMACEN RAPIDITAS BIMBO		7793890258264	1133.00	1500.00	0.000	21	/uploads/7793890258264.jpg	2026-01-12 15:55:59.588673-03	2026-01-17 11:39:27.481261-03	f	\N	f	t	\N	\N	none	1
27911	GALLETITAS HOJALMAR PALMERITAS		7793450000364	928.40	1250.00	-7.000	25	/uploads/7793450000364.jpg	2026-01-12 15:55:59.596867-03	2026-01-17 11:39:27.488728-03	f	\N	f	t	\N	\N	none	1
27912	GALLETITAS OKEBON PANAL VAINILLA		7790263119689	891.00	1100.00	0.000	25	/uploads/7790263119689.jpg	2026-01-12 15:55:59.601026-03	2026-01-17 11:39:27.492882-03	f	\N	f	t	\N	\N	none	1
27914	GALLETITAS MINI CHIPIS		7791324157664	768.90	1000.00	0.000	25	/uploads/7791324157664.jpg	2026-01-12 15:55:59.648513-03	2026-01-17 11:39:27.497518-03	f	\N	f	t	\N	\N	none	1
27915	ALMACEN CHOCOLINO LA VIRGINIA		7790150830468	0.00	0.00	0.000	21	/uploads/7790150830468.jpg	2026-01-12 15:55:59.653101-03	2026-01-17 11:39:27.501089-03	f	\N	f	t	\N	\N	none	1
27918	FIAMBRERIA FETAS QUESO AZUL		7798060853423	1076.90	1320.00	2.000	20	/uploads/7798060853423.jpg	2026-01-12 15:55:59.663438-03	2026-01-17 11:39:27.507736-03	f	\N	f	t	\N	\N	none	1
27919	ALMACEN GARRAPIÑADA DE MANI		GARRRRRR	5538.50	7800.00	-0.685	21	/uploads/GARRRRRR.jpg	2026-01-12 15:55:59.66658-03	2026-01-17 11:39:27.510942-03	f	\N	f	t	\N	\N	none	1
27920	FARMACIA TAFIROL FLEX  PARACETANOL		7798140258674	256.30	350.00	8.000	30	/uploads/7798140258674.jpg	2026-01-12 15:55:59.669619-03	2026-01-17 11:39:27.513772-03	f	\N	f	t	\N	\N	none	1
27922	GALLETITAS GALLETITAS MACUCAS		7790040133495	633.60	850.00	-1.000	25	/uploads/7790040133495.jpg	2026-01-12 15:55:59.67594-03	2026-01-17 11:39:27.519056-03	f	\N	f	t	\N	\N	none	1
27923	GALLETITAS CRACKERS SMAMS		7798181510212	1367.30	1615.00	0.000	25	/uploads/7798181510212.jpg	2026-01-12 15:55:59.679346-03	2026-01-17 11:39:27.522844-03	f	\N	f	t	\N	\N	none	1
27924	GALLETITAS FORMIS ANIMALES		7790040139916	643.50	850.00	-2.000	25	/uploads/7790040139916.jpg	2026-01-12 15:55:59.682771-03	2026-01-17 11:39:27.525421-03	f	\N	f	t	\N	\N	none	1
27925	GALLETITAS COQUITAS		7790040139411	748.00	920.00	3.000	25	/uploads/7790040139411.jpg	2026-01-12 15:55:59.685941-03	2026-01-17 11:39:27.528181-03	f	\N	f	t	\N	\N	none	1
27926	ALMACEN AZUCAR IMPALPABLE		768731920010	581.90	750.00	3.000	21	/uploads/768731920010.jpg	2026-01-12 15:55:59.688574-03	2026-01-17 11:39:27.531695-03	f	\N	f	t	\N	\N	none	1
27913	GALLETITAS TERRABUSI SCONS		7622201491611	574.00	2632.50	2.000	25	/uploads/7622201491611.jpg	2026-01-12 15:55:59.605263-03	2026-01-12 15:55:59.605263-03	f	\N	f	t	\N	\N	none	1
27928	ALMACEN BISCOCHUELO RAVANA CHIPS		7790971002266	2673.00	3300.00	3.000	21	/uploads/7790971002266.jpg	2026-01-12 15:55:59.693635-03	2026-01-17 11:39:27.538318-03	f	\N	f	t	\N	\N	none	1
27929	ALMACEN BARBACOA DANICA		7791620187716	1366.20	1800.00	-2.000	21	/uploads/7791620187716.jpg	2026-01-12 15:55:59.69587-03	2026-01-17 11:39:27.541407-03	f	\N	f	t	\N	\N	none	1
27917	FIAMBRERIA FETAS TONADITA PROVOLONE		7798060853355	979.00	4455.00	-1.000	20	/uploads/7798060853355.jpg	2026-01-12 15:55:59.660191-03	2026-01-12 15:55:59.660191-03	f	\N	f	t	\N	\N	none	1
27930	PIEZA ART.LIM TALCO POLVO PARA PIES X100		ALGABOOOO	847.00	1150.00	-1.000	29	/uploads/ALGABOOOO.jpg	2026-01-12 15:55:59.698291-03	2026-01-17 11:39:27.546028-03	f	\N	f	t	\N	\N	none	1
27931	GALLETITAS TRIANGULITOS MAFALDA		MAFALDDDDDDF	540.10	680.00	3.000	25	\N	2026-01-12 15:55:59.700634-03	2026-01-17 11:39:27.54987-03	f	\N	f	t	\N	\N	none	1
27932	BODEGA MICHEL TORINO		MICHELLLLLL	990.00	1300.00	1.000	37	\N	2026-01-12 15:55:59.702841-03	2026-01-17 11:39:27.552619-03	f	\N	f	t	\N	\N	none	1
27933	GALLETITAS LEGENDARIAS		7792684000706	1335.40	1750.00	14.000	25	/uploads/7792684000706.jpg	2026-01-12 15:55:59.705291-03	2026-01-17 11:39:27.556188-03	f	\N	f	t	\N	\N	none	1
27935	ALMACEN CHOCOLINO X180G		7790150830444	992.20	1220.00	3.000	21	/uploads/7790150830444.jpg	2026-01-12 15:55:59.710167-03	2026-01-17 11:39:27.563643-03	f	\N	f	t	\N	\N	none	1
27936	GALLETITAS FRUTIGRAN FRUTOS ROJOS		7790045825791	1658.80	2050.00	1.000	25	/uploads/7790045825791.jpg	2026-01-12 15:55:59.712376-03	2026-01-17 11:39:27.56643-03	f	\N	f	t	\N	\N	none	1
27938	BODEGA LATON GOLDEN 710		7793147572624	2915.00	3600.00	9.000	37	/uploads/7793147572624.jpg	2026-01-12 15:55:59.716794-03	2026-01-17 11:39:27.568824-03	f	\N	f	t	\N	\N	none	1
27940	ALMACEN SEMOLA FINA		7791954001016	671.00	850.00	-6.000	21	/uploads/7791954001016.jpg	2026-01-12 15:55:59.72167-03	2026-01-17 11:39:27.573578-03	f	\N	f	t	\N	\N	none	1
27941	LACTEOS LECHE BOTELLA LARGA VIDA		7790742335500	0.00	0.00	0.000	26	/uploads/7790742335500.jpg	2026-01-12 15:55:59.723955-03	2026-01-17 11:39:27.577796-03	f	\N	f	t	\N	\N	none	1
27942	UNIDAD DEUDA		DEUDA	0.77	1.00	-1060933.260	52	\N	2026-01-12 15:55:59.726225-03	2026-01-17 11:39:27.581244-03	f	\N	f	t	\N	\N	none	1
27943	UNIDAD GRISINES		GRISINES	2200.00	2400.00	99974.026	52	\N	2026-01-12 15:55:59.728566-03	2026-01-17 11:39:27.584313-03	f	\N	f	t	\N	\N	none	1
27944	ALMACEN GALLETAS DE CEMOLA		GALLETASSSSSSS	0.00	0.00	0.000	21	\N	2026-01-12 15:55:59.731081-03	2026-01-17 11:39:27.587582-03	f	\N	f	t	\N	\N	none	1
27945	UNIDAD BIYUTERI		111	0.00	1.00	-2580.000	52	/uploads/1111.jpg	2026-01-12 15:55:59.73399-03	2026-01-17 11:39:27.589957-03	f	\N	f	t	\N	\N	none	1
27946	ALMACEN ARROZ APOSTOLES		7791120100208	574.20	900.00	-5.000	\N	/uploads/7791120100208.jpg	2026-01-12 15:55:59.737623-03	2026-01-17 11:39:27.592646-03	f	\N	f	t	\N	\N	none	1
27937	ALMACEN MACRITAS NACHOS		7790538010291	1068.00	4893.75	0.000	21	/uploads/7790538010291.jpg	2026-01-12 15:55:59.714538-03	2026-01-12 15:55:59.714538-03	f	\N	f	t	\N	\N	none	1
27948	BEBIDA TRES TORRES LIMON		7790950003444	872.30	1100.00	2.000	19	/uploads/7790950003444.jpg	2026-01-12 15:55:59.74463-03	2026-01-17 11:39:27.598087-03	f	\N	f	t	\N	\N	none	1
27949	BEBIDA TRES TORRES BLANCO		7790950003437	872.30	1100.00	0.000	19	/uploads/7790950003437.jpg	2026-01-12 15:55:59.747548-03	2026-01-17 11:39:27.600473-03	f	\N	f	t	\N	\N	none	1
27950	GOLOSINAS ALFAJOR VAUQUITA		7798138291423	644.60	800.00	-5.000	18	/uploads/7798138291423.jpg	2026-01-12 15:55:59.750199-03	2026-01-17 11:39:27.603713-03	f	\N	f	t	\N	\N	none	1
27951	GOLOSINAS ALFAJOR BLOK		7790040659605	958.10	1250.00	1.000	18	/uploads/7790040659605.jpg	2026-01-12 15:55:59.752608-03	2026-01-17 11:39:27.610226-03	f	\N	f	t	\N	\N	none	1
27954	ALMACEN LINO		LINOOOOO	3443.00	5000.00	1.000	21	\N	2026-01-12 15:55:59.761678-03	2026-01-17 11:39:27.620202-03	f	\N	f	t	\N	\N	none	1
27955	ALMACEN GIRASOL SEMILLAS		GIRASOLLLLLLLL	4103.00	6000.00	0.950	21	/uploads/GIRASOLLLLLLLL.jpg	2026-01-12 15:55:59.766112-03	2026-01-17 11:39:27.624875-03	f	\N	f	t	\N	\N	none	1
27956	ALMACEN HARINA DE AVENA		HARINAAAASA	2255.00	3070.00	-2.000	21	\N	2026-01-12 15:55:59.770034-03	2026-01-17 11:39:27.629867-03	f	\N	f	t	\N	\N	none	1
27957	UNIDAD ENVASE VIDRIO		ENVASE	550.00	1500.00	-13.000	52	\N	2026-01-12 15:55:59.773428-03	2026-01-17 11:39:27.634674-03	f	\N	f	t	\N	\N	none	1
27959	BEBIDA JUGO DE ARANDANOS		7798107990210	1631.30	2000.00	1.000	19	/uploads/7798107990210.jpg	2026-01-12 15:55:59.778544-03	2026-01-17 11:39:27.639909-03	f	\N	f	t	\N	\N	none	1
27952	GOLOSINAS ALFAJOR TERRABUSI SIMPLE		77939234	650.00	3307.50	1.000	18	/uploads/77939234.jpg	2026-01-12 15:55:59.755134-03	2026-01-12 15:55:59.755134-03	f	\N	f	t	\N	\N	none	1
27960	ALMACEN POLENTA DEL CAMPO		7798004720088	0.00	0.00	0.000	21	/uploads/7798004720088.jpg	2026-01-12 15:55:59.781251-03	2026-01-17 11:39:27.646202-03	f	\N	f	t	\N	\N	none	1
27958	CONGELADOS HELADO		HELADO	100.00	675.00	4.000	17	/uploads/HELADOO.jpg	2026-01-12 15:55:59.776244-03	2026-01-12 15:55:59.776244-03	f	\N	f	t	\N	\N	none	1
27961	UNIDAD BOTELLA		BOTELLA	0.00	600.00	7.000	52	/uploads/BOTELLA SPORT.jpg	2026-01-12 15:55:59.784612-03	2026-01-17 11:39:27.651285-03	f	\N	f	t	\N	\N	none	1
27963	GOLOSINAS ALFAJOR TODDY		7790380023579	880.00	1050.00	3.000	18	/uploads/7790380023579.jpg	2026-01-12 15:55:59.792582-03	2026-01-17 11:39:27.660928-03	f	\N	f	t	\N	\N	none	1
27964	BODEGA TORO TINTO		7790314079054	1760.00	2200.00	0.000	37	/uploads/7790314079054.jpg	2026-01-12 15:55:59.796143-03	2026-01-17 11:39:27.666149-03	f	\N	f	t	\N	\N	none	1
27965	GOLOSINAS TOPLINE X16		77951113	497.20	700.00	15.000	18	/uploads/77951113.jpg	2026-01-12 15:55:59.79873-03	2026-01-17 11:39:27.671078-03	f	\N	f	t	\N	\N	none	1
27970	ALMACEN BOMBILLA SEBILLE PLANA		BOMVILLLLLA	1903.00	3350.00	1.000	21	/uploads/BOMVILLLLLA.jpg	2026-01-12 15:55:59.812259-03	2026-01-17 11:39:27.690635-03	f	\N	f	t	\N	\N	none	1
27971	ALMACEN MAGICLICK		7794536000001	3188.90	3920.00	2.000	21	/uploads/7794536000001.jpg	2026-01-12 15:55:59.815973-03	2026-01-17 11:39:27.693027-03	f	\N	f	t	\N	\N	none	1
27972	ALMACEN MAGICLICK PARTI		7794536000599	1699.50	2100.00	0.000	21	/uploads/7794536000599.jpg	2026-01-12 15:55:59.819266-03	2026-01-17 11:39:27.695908-03	f	\N	f	t	\N	\N	none	1
27987	ALMACEN HAMBURGUESAS DE POLLO 🐓		HAMBURRRR	4800.00	21937.50	0.090	21	\N	2026-01-12 15:55:59.87475-03	2026-01-12 15:55:59.87475-03	f	\N	f	t	\N	\N	none	1
27973	ALMACEN BOMBILLA DE COLORES		7798030841610	612.70	1000.00	1.000	21	/uploads/7798030841610.jpg	2026-01-12 15:55:59.823342-03	2026-01-17 11:39:27.698664-03	f	\N	f	t	\N	\N	none	1
27974	ALMACEN 3D .		04615378	3810.40	4550.00	6.000	21	/uploads/04615378.jpg	2026-01-12 15:55:59.826802-03	2026-01-17 11:39:27.703537-03	f	\N	f	t	\N	\N	none	1
27976	BODEGA LICOR CAFE AL COÑAC		43003PLUMASSSSS	3478.20	4300.00	0.000	37	/uploads/43003PLUMASSSSS.jpg	2026-01-12 15:55:59.83476-03	2026-01-17 11:39:27.719077-03	f	\N	f	t	\N	\N	none	1
27977	BODEGA VIÑA MAYOR		7790036974583	1089.00	1450.00	0.000	37	/uploads/7790036974583.jpg	2026-01-12 15:55:59.838205-03	2026-01-17 11:39:27.724268-03	f	\N	f	t	\N	\N	none	1
27978	ALMACEN MAYOLIVA		7791866003283	2081.20	2708.00	8.000	21	/uploads/7791866003283.jpg	2026-01-12 15:55:59.841855-03	2026-01-17 11:39:27.728476-03	f	\N	f	t	\N	\N	none	1
27981	UNIDAD EFECTIVO RETIRADO DE LA CAJA		EFECTIVO	0.00	1.00	92000.000	52	\N	2026-01-12 15:55:59.853019-03	2026-01-17 11:39:27.736676-03	f	\N	f	t	\N	\N	none	1
27982	CONGELADOS ALITA DE POLLO		ALITA	1320.00	1650.00	2.210	17	/uploads/ALITA.jpg	2026-01-12 15:55:59.85611-03	2026-01-17 11:39:27.741105-03	f	\N	f	t	\N	\N	none	1
27983	ALMACEN LOCOTO		LOCOTOOOOO	242.00	400.00	11.000	21	/uploads/LOCOTOOOOO.jpg	2026-01-12 15:55:59.860013-03	2026-01-17 11:39:27.746604-03	f	\N	f	t	\N	\N	none	1
27984	ALMACEN PAPAS PAY SUELTA		PAPASSSSSSSS	9900.00	13500.00	0.099	21	/uploads/PAPASSSSSSSS.jpg	2026-01-12 15:55:59.864205-03	2026-01-17 11:39:27.751803-03	f	\N	f	t	\N	\N	none	1
27985	ALMACEN TOMATE LATA MAROLIO		7797470124574	755.70	1000.00	1.000	21	/uploads/7797470124574.jpg	2026-01-12 15:55:59.868453-03	2026-01-17 11:39:27.756313-03	f	\N	f	t	\N	\N	none	1
27986	BODEGA UVITA TINTO		UVITAAAAA	1398.10	1900.00	10.000	37	\N	2026-01-12 15:55:59.872032-03	2026-01-17 11:39:27.761242-03	f	\N	f	t	\N	\N	none	1
27988	ALMACEN PEPITAS PATNOR		PEPITASSD	520.30	650.00	6.000	21	\N	2026-01-12 15:55:59.877245-03	2026-01-17 11:39:27.765514-03	f	\N	f	t	\N	\N	none	1
27989	ALMACEN SMAMS BISCUITS		7798181510120	1855.70	1900.00	0.000	21	/uploads/7798181510120.jpg	2026-01-12 15:55:59.87953-03	2026-01-17 11:39:27.76983-03	f	\N	f	t	\N	\N	none	1
27991	ALMACEN PEPITAS		7791324156995	520.30	650.00	-1.000	21	/uploads/7791324156995.jpg	2026-01-12 15:55:59.885931-03	2026-01-17 11:39:27.775796-03	f	\N	f	t	\N	\N	none	1
27992	ALMACEN GALLETITAS COFLER  RELLENAS		7790040143807	784.30	1000.00	2.000	21	/uploads/7790040143807.jpg	2026-01-12 15:55:59.888769-03	2026-01-17 11:39:27.778272-03	f	\N	f	t	\N	\N	none	1
27993	GALLETITAS COFLER BLOK		7790040116955	1252.90	1600.00	2.000	21	/uploads/7790040116955.jpg	2026-01-12 15:55:59.891327-03	2026-01-17 11:39:27.780701-03	f	\N	f	t	\N	\N	none	1
27979	GOLOSINAS ALFAJOR BON O BON		BONOBONNN	781.00	3543.75	-1.000	18	/uploads/BONOBONNNNNN.jpg	2026-01-12 15:55:59.84537-03	2026-01-12 15:55:59.84537-03	f	\N	f	t	\N	\N	none	1
27994	ALMACEN SAPITO		77928894	190.30	300.00	10.000	21	/uploads/77928894.jpg	2026-01-12 15:55:59.893661-03	2026-01-17 11:39:27.783248-03	f	\N	f	t	\N	\N	none	1
27996	ALMACEN PAN DE PATI FARGO		PANNNNNNNN	1310.10	1700.00	3.000	21	/uploads/PANNNNNNNNM.jpg	2026-01-12 15:55:59.898274-03	2026-01-17 11:39:27.788422-03	f	\N	f	t	\N	\N	none	1
27997	ALMACEN PAN CON CHICHARRON		CHICHARON	1760.00	3400.00	-9.460	21	/uploads/CHICHARON.jpg	2026-01-12 15:55:59.900552-03	2026-01-17 11:39:27.791034-03	f	\N	f	t	\N	\N	none	1
27998	ALMACEN PINZITAS DE DEPILAR		PINZITASSSSSS	588.50	1000.00	11.000	21	/uploads/PINZITASSSSSS.jpg	2026-01-12 15:55:59.902654-03	2026-01-17 11:39:27.794021-03	f	\N	f	t	\N	\N	none	1
27999	ALMACEN INVISIBLES		7798087370019	335.50	700.00	9.000	21	/uploads/7798087370019.jpg	2026-01-12 15:55:59.904985-03	2026-01-17 11:39:27.797584-03	f	\N	f	t	\N	\N	none	1
28000	ALMACEN LAPIZ BIC X UNIDAD		270220004608	273.90	380.00	-2.000	21	/uploads/270220004608.jpg	2026-01-12 15:55:59.908489-03	2026-01-17 11:39:27.800088-03	f	\N	f	t	\N	\N	none	1
28002	FARMACIA TE VENTRES		TEVENTRESSSSSSS	821.70	1400.00	10.000	30	/uploads/TEVENTRESSSSSSS.jpg	2026-01-12 15:55:59.914534-03	2026-01-17 11:39:27.804847-03	f	\N	f	t	\N	\N	none	1
28003	ALMACEN ARVEJAS PARTIDAS		7790279001152	578.60	750.00	7.000	21	/uploads/7790279001152.jpg	2026-01-12 15:55:59.917293-03	2026-01-17 11:39:27.807627-03	f	\N	f	t	\N	\N	none	1
28004	ALMACEN PAN DE CAMPO		PPPPAAASANNNNNN	1045.00	1250.00	-103.600	21	/uploads/PPPPAAASANNNNNN.jpg	2026-01-12 15:55:59.920527-03	2026-01-17 11:39:27.810742-03	f	\N	f	t	\N	\N	none	1
28006	ART.LIMPIEZA ESCOBILLON GONDOLA		ESCOBILLONNNNN	2956.80	3700.00	2.000	29	/uploads/ESCOBILLONNNNN.jpg	2026-01-12 15:55:59.926814-03	2026-01-17 11:39:27.816445-03	f	\N	f	t	\N	\N	none	1
28007	ART.LIMPIEZA PALITA CON CABO		PALITAAAAAAA	1733.60	2500.00	3.000	29	\N	2026-01-12 15:55:59.929448-03	2026-01-17 11:39:27.818833-03	f	\N	f	t	\N	\N	none	1
28008	ART.LIMPIEZA CEPILLO DE MANO		CEPILLOOOO	860.20	1100.00	1.000	29	\N	2026-01-12 15:55:59.931983-03	2026-01-17 11:39:27.821201-03	f	\N	f	t	\N	\N	none	1
28009	ABI VASO XL		123	1501.50	2300.00	3.000	54	/uploads/123.jpg	2026-01-12 15:55:59.93613-03	2026-01-17 11:39:27.825067-03	f	\N	f	t	\N	\N	none	1
28010	ABI VASO AKIRA		5234	1028.50	1500.00	0.000	54	/uploads/5234.jpg	2026-01-12 15:55:59.940389-03	2026-01-17 11:39:27.828542-03	f	\N	f	t	\N	\N	none	1
28011	ABI MATE PALABRA		6543	3272.50	4500.00	1.000	54	/uploads/6543.jpg	2026-01-12 15:55:59.946806-03	2026-01-17 11:39:27.83157-03	f	\N	f	t	\N	\N	none	1
28012	ABI MATE ESCUDO		876	3465.00	4800.00	1.000	54	/uploads/876.jpg	2026-01-12 15:55:59.951428-03	2026-01-17 11:39:27.835916-03	f	\N	f	t	\N	\N	none	1
28013	ABI VASO TERMICO		987	2079.00	3000.00	2.000	54	/uploads/987.jpg	2026-01-12 15:55:59.955586-03	2026-01-17 11:39:27.83905-03	f	\N	f	t	\N	\N	none	1
28014	ABI TAZA CUADRILLE		094	2328.70	3200.00	1.000	54	/uploads/094.jpg	2026-01-12 15:55:59.959638-03	2026-01-17 11:39:27.841899-03	f	\N	f	t	\N	\N	none	1
28015	ABI TAZA ANIMADA		589	2953.50	4100.00	1.000	54	/uploads/589.jpg	2026-01-12 15:55:59.963595-03	2026-01-17 11:39:27.844307-03	f	\N	f	t	\N	\N	none	1
28016	ABI STICKER		539	908.60	1300.00	2.000	54	/uploads/539.jpg	2026-01-12 15:55:59.967101-03	2026-01-17 11:39:27.846967-03	f	\N	f	t	\N	\N	none	1
28018	ABI TUBITOS GOMITAS		501	616.00	900.00	1.000	54	/uploads/501.jpg	2026-01-12 15:55:59.973607-03	2026-01-17 11:39:27.851593-03	f	\N	f	t	\N	\N	none	1
28025	ABI PLANNERS IMANTADO		307	1875.50	3000.00	1.000	54	/uploads/307.jpg	2026-01-12 15:56:00.034069-03	2026-01-17 11:39:27.854423-03	f	\N	f	t	\N	\N	none	1
28019	ABI BLOCK HOJAS		109	532.00	2700.00	0.000	54	/uploads/109.jpg	2026-01-12 15:55:59.976934-03	2026-01-12 15:55:59.976934-03	f	\N	f	t	\N	\N	none	1
28020	ABI ANOTADORES ANILLADOS		4087	500.00	2700.00	1.000	54	/uploads/4087.jpg	2026-01-12 15:55:59.980162-03	2026-01-12 15:55:59.980162-03	f	\N	f	t	\N	\N	none	1
28021	ABI ANOTADORES ECO		529	354.00	2025.00	2.000	54	/uploads/529.jpg	2026-01-12 15:55:59.983808-03	2026-01-12 15:55:59.983808-03	f	\N	f	t	\N	\N	none	1
28023	ABI CUADERNOS HOLOGRAMA		396	927.00	5062.50	2.000	54	/uploads/396.jpg	2026-01-12 15:55:59.991098-03	2026-01-12 15:55:59.991098-03	f	\N	f	t	\N	\N	none	1
28024	ABI CUADERNILLO MEDIANO		492	2550.00	13500.00	1.000	54	/uploads/492.jpg	2026-01-12 15:55:59.995909-03	2026-01-12 15:55:59.995909-03	f	\N	f	t	\N	\N	none	1
28026	ABI COLITAS		2045	460.00	2362.50	1.000	54	/uploads/2045.jpg	2026-01-12 15:56:00.03861-03	2026-01-12 15:56:00.03861-03	f	\N	f	t	\N	\N	none	1
28027	ABI BOLSA MANIJA		1935	200.00	843.75	9.000	54	/uploads/1935.jpg	2026-01-12 15:56:00.042727-03	2026-01-12 15:56:00.042727-03	f	\N	f	t	\N	\N	none	1
28030	ABI MOÑO REGALO		1088	22.00	50.00	99.000	54	/uploads/1088.jpg	2026-01-12 15:56:00.05565-03	2026-01-17 11:39:27.857935-03	f	\N	f	t	\N	\N	none	1
28031	MEDIAS ELEMENTO NIÑOS TALLE 2		345	1980.00	2500.00	6.000	55	/uploads/345.jpg	2026-01-12 15:56:00.059452-03	2026-01-17 11:39:27.861364-03	f	\N	f	t	\N	\N	none	1
28033	MEDIAS ELEMENTO BEBE TALLE 1		2645	1650.00	2100.00	2.000	55	/uploads/2645.jpg	2026-01-12 15:56:00.065808-03	2026-01-17 11:39:27.868305-03	f	\N	f	t	\N	\N	none	1
28034	MEDIAS NENAS COMUNES TALLE 2		7638	1430.00	1800.00	6.000	55	/uploads/7638.jpg	2026-01-12 15:56:00.06831-03	2026-01-17 11:39:27.87341-03	f	\N	f	t	\N	\N	none	1
28035	MEDIAS SUPER BALANCE		2762	1210.00	1500.00	6.000	55	/uploads/2762.jpg	2026-01-12 15:56:00.070922-03	2026-01-17 11:39:27.878601-03	f	\N	f	t	\N	\N	none	1
28036	MEDIAS INVISIBLES TALLE ADULTO		7365	1100.00	1500.00	13.000	55	/uploads/7365.jpg	2026-01-12 15:56:00.073185-03	2026-01-17 11:39:27.884322-03	f	\N	f	t	\N	\N	none	1
28037	MEDIAS BLANCAS Y GRISES TALLE 2		26543	990.00	1300.00	11.000	55	/uploads/26543.jpg	2026-01-12 15:56:00.075547-03	2026-01-17 11:39:27.889323-03	f	\N	f	t	\N	\N	none	1
28039	ALMACEN CREMETTE LA TONADITA		QUESOOOOOO	2005.30	2500.00	4.000	21	/uploads/QUESOOOOOO.jpg	2026-01-12 15:56:00.081894-03	2026-01-17 11:39:27.898627-03	f	\N	f	t	\N	\N	none	1
28040	BODEGA FRIZZE LATA		FRIZEEEEEEEE	990.00	1250.00	0.000	37	/uploads/FRIZEEEEEEEE.jpg	2026-01-12 15:56:00.086949-03	2026-01-17 11:39:27.901685-03	f	\N	f	t	\N	\N	none	1
28041	ALMACEN CREMA CHANTILLY		CREMAAAAAAAA	4103.00	4750.00	-4.000	21	/uploads/CREMAAAAAAAA.jpg	2026-01-12 15:56:00.090554-03	2026-01-17 11:39:27.904101-03	f	\N	f	t	\N	\N	none	1
28042	ALMACEN MIEL DE CAMPO		MIELLLLLL	0.00	0.00	0.000	21	/uploads/MIELLLLLL.jpg	2026-01-12 15:56:00.093892-03	2026-01-17 11:39:27.906733-03	f	\N	f	t	\N	\N	none	1
28044	ALMACEN FRASCO ESTERIL		FRASCOOOOOO	440.00	900.00	1.000	21	/uploads/FRASCOOOOOO.jpg	2026-01-12 15:56:00.098913-03	2026-01-17 11:39:27.909204-03	f	\N	f	t	\N	\N	none	1
28045	ART VARIOS BICIFIX PARCHE Y SOLUCION		BICIFIXXXXX	866.80	1200.00	-3.000	39	/uploads/BICIFIXXXXX.jpg	2026-01-12 15:56:00.101491-03	2026-01-17 11:39:27.911698-03	f	\N	f	t	\N	\N	none	1
28046	ART VARIOS MAMADERA		MAMADERAAAAAA	720.50	1000.00	0.000	39	/uploads/MAMADERAAAAAA.jpg	2026-01-12 15:56:00.103829-03	2026-01-17 11:39:27.91417-03	f	\N	f	t	\N	\N	none	1
28048	BIJOUTERI ARITO ESTRELLA		1001	1092.30	1900.00	2.000	56	/uploads/1001.jpg	2026-01-12 15:56:00.108908-03	2026-01-17 11:39:27.919968-03	f	\N	f	t	\N	\N	none	1
28049	BIJOUTERI ARITO INFINITO		1002	1092.30	1900.00	2.000	56	/uploads/1002.jpg	2026-01-12 15:56:00.112026-03	2026-01-17 11:39:27.922432-03	f	\N	f	t	\N	\N	none	1
28050	BIJOUTERI ARITO LUNA		1003	1092.30	1900.00	2.000	56	/uploads/1003.jpg	2026-01-12 15:56:00.114997-03	2026-01-17 11:39:27.924681-03	f	\N	f	t	\N	\N	none	1
28051	BIJOUTERI ARITO PERLITA		1153	1092.30	1900.00	3.000	56	/uploads/1153.jpg	2026-01-12 15:56:00.117545-03	2026-01-17 11:39:27.927369-03	f	\N	f	t	\N	\N	none	1
28052	BIJOUTERI ARITO  CIRCULO NEGRO X DENTRO		1000	1111.00	2000.00	3.000	56	/uploads/1000.jpg	2026-01-12 15:56:00.120223-03	2026-01-17 11:39:27.929626-03	f	\N	f	t	\N	\N	none	1
28054	BIJOUTERI ARITOS NEGROS		1123	1210.00	2200.00	2.000	56	/uploads/1123.jpg	2026-01-12 15:56:00.125534-03	2026-01-17 11:39:27.934805-03	f	\N	f	t	\N	\N	none	1
28055	BIJOUTERI DIJES CRUZ		235	1650.00	2500.00	3.000	56	/uploads/235.jpg	2026-01-12 15:56:00.128119-03	2026-01-17 11:39:27.937526-03	f	\N	f	t	\N	\N	none	1
28056	BIJOUTERI ARITO REDONO CHICO		1043	946.00	1800.00	1.000	56	/uploads/1043.jpg	2026-01-12 15:56:00.130397-03	2026-01-17 11:39:27.939903-03	f	\N	f	t	\N	\N	none	1
28057	BIJOUTERI CONJUNTO CADENITA Y AROS		384-_1039	2530.00	4000.00	2.000	56	/uploads/384-_1039.jpg	2026-01-12 15:56:00.132876-03	2026-01-17 11:39:27.942098-03	f	\N	f	t	\N	\N	none	1
28058	BIJOUTERI ARITO PERLAS EL PAR		385	440.00	800.00	4.000	56	/uploads/385.jpg	2026-01-12 15:56:00.135404-03	2026-01-17 11:39:27.944424-03	f	\N	f	t	\N	\N	none	1
28059	BIJOUTERI MARIPOSA CONJUNTO		3435	1980.00	3600.00	3.000	56	/uploads/3435.jpg	2026-01-12 15:56:00.138031-03	2026-01-17 11:39:27.948018-03	f	\N	f	t	\N	\N	none	1
28060	BIJOUTERI PULSERA CRUZ		1073	4400.00	7000.00	1.000	56	/uploads/1073.jpg	2026-01-12 15:56:00.140385-03	2026-01-17 11:39:27.951655-03	f	\N	f	t	\N	\N	none	1
28062	BIJOUTERI PIERCING		1020	220.00	400.00	11.000	56	/uploads/1020.jpg	2026-01-12 15:56:00.144687-03	2026-01-17 11:39:27.95763-03	f	\N	f	t	\N	\N	none	1
28063	BIJOUTERI PIERCING COLOR		2823	275.00	500.00	7.000	56	/uploads/2823.jpg	2026-01-12 15:56:00.147134-03	2026-01-17 11:39:27.960076-03	f	\N	f	t	\N	\N	none	1
28064	UNIDAD BIJOUTERI ARITO  ABRIDOR PIEDRITA		1678	539.00	1000.00	21.000	56	/uploads/1678.jpg	2026-01-12 15:56:00.149515-03	2026-01-17 11:39:27.96324-03	f	\N	f	t	\N	\N	none	1
28065	BIJOUTERI ARITO BOLITA ACERO X PAR		1079	165.00	500.00	32.000	56	/uploads/1079.jpg	2026-01-12 15:56:00.151851-03	2026-01-17 11:39:27.966667-03	f	\N	f	t	\N	\N	none	1
28067	BIJOUTERI ARITO PIEDRITA COLOR X PAR		1023	220.00	400.00	34.000	56	/uploads/1023.jpg	2026-01-12 15:56:00.156431-03	2026-01-17 11:39:27.973489-03	f	\N	f	t	\N	\N	none	1
28068	BIJOUTERI PIERCING NARIZ X UNIDAD		060	220.00	400.00	35.000	56	/uploads/060.jpg	2026-01-12 15:56:00.158928-03	2026-01-17 11:39:27.977493-03	f	\N	f	t	\N	\N	none	1
28069	BIJOUTERI PULSERA ACERO		597	5280.00	7000.00	1.000	56	/uploads/597.jpg	2026-01-12 15:56:00.161154-03	2026-01-17 11:39:27.980295-03	f	\N	f	t	\N	\N	none	1
28070	BIJOUTERI PUCERA BOLITAS Y CORAZON		312	5280.00	7000.00	0.000	56	/uploads/312.jpg	2026-01-12 15:56:00.164224-03	2026-01-17 11:39:27.982674-03	f	\N	f	t	\N	\N	none	1
28071	BIJOUTERI CADENA HOMBRE		560	2090.00	3800.00	0.000	56	/uploads/560.jpg	2026-01-12 15:56:00.166721-03	2026-01-17 11:39:27.985061-03	f	\N	f	t	\N	\N	none	1
28072	BIJOUTERI CADENA HOMBRE GRUESA		310	2310.00	4500.00	1.000	56	/uploads/310.jpg	2026-01-12 15:56:00.169335-03	2026-01-17 11:39:27.987683-03	f	\N	f	t	\N	\N	none	1
28074	BIJOUTERI PULSERA PIEDRITAS COLOR		101	4180.00	7000.00	1.000	56	/uploads/101.jpg	2026-01-12 15:56:00.175397-03	2026-01-17 11:39:27.993063-03	f	\N	f	t	\N	\N	none	1
28075	BIJOUTERI CADENAS MUJER		087	1870.00	3500.00	3.000	56	/uploads/087.jpg	2026-01-12 15:56:00.177773-03	2026-01-17 11:39:27.996282-03	f	\N	f	t	\N	\N	none	1
28076	BIJOUTERI DIJES CORAZON  X UNIDAD		058	528.00	900.00	2.000	56	/uploads/058.jpg	2026-01-12 15:56:00.180093-03	2026-01-17 11:39:27.998743-03	f	\N	f	t	\N	\N	none	1
28077	BIJOUTERI DIJES CORONA X UNIDAD		398	1375.00	2500.00	1.000	56	/uploads/398.jpg	2026-01-12 15:56:00.182834-03	2026-01-17 11:39:28.000993-03	f	\N	f	t	\N	\N	none	1
28079	BIJOUTERI PERFILADORES X UNIDAD		097	1210.00	1800.00	-5.000	56	/uploads/097.jpg	2026-01-12 15:56:00.190713-03	2026-01-17 11:39:28.005693-03	f	\N	f	t	\N	\N	none	1
28080	BIJOUTERI SET LIMPIEZA CUTIS		869	3850.00	5500.00	0.000	56	/uploads/869.jpg	2026-01-12 15:56:00.194374-03	2026-01-17 11:39:28.008583-03	f	\N	f	t	\N	\N	none	1
28081	BIJOUTERI SET ESPONJA CUTIS CORAZON		0O38	1650.00	2500.00	1.000	56	/uploads/0O38.jpg	2026-01-12 15:56:00.197607-03	2026-01-17 11:39:28.011302-03	f	\N	f	t	\N	\N	none	1
28082	BIJOUTERI SET ESPONJA TREBOL		0037	1650.00	2500.00	0.000	56	/uploads/0037.jpg	2026-01-12 15:56:00.20132-03	2026-01-17 11:39:28.013779-03	f	\N	f	t	\N	\N	none	1
28083	BIJOUTERI ANILLO CIRCULO NEGRO		019	1430.00	2000.00	2.000	56	/uploads/019.jpg	2026-01-12 15:56:00.205162-03	2026-01-17 11:39:28.016441-03	f	\N	f	t	\N	\N	none	1
28084	BIJOUTERI ANILLO CIRCULO NEGRO Y DOS PELOTITAS		0019	1210.00	1800.00	3.000	56	/uploads/0019.jpg	2026-01-12 15:56:00.208154-03	2026-01-17 11:39:28.018808-03	f	\N	f	t	\N	\N	none	1
28085	BIJOUTERI ANILLO CON DIAMANTE		018	1210.00	1800.00	2.000	56	/uploads/018.jpg	2026-01-12 15:56:00.212018-03	2026-01-17 11:39:28.021205-03	f	\N	f	t	\N	\N	none	1
28086	BIJOUTERI ANILLO COMPROMISO		00019	440.00	1000.00	1.000	56	/uploads/00019.jpg	2026-01-12 15:56:00.215088-03	2026-01-17 11:39:28.023562-03	f	\N	f	t	\N	\N	none	1
28088	BIJOUTERI ANILLO CORAZON		0020	550.00	1100.00	3.000	56	/uploads/0020.jpg	2026-01-12 15:56:00.22191-03	2026-01-17 11:39:28.028708-03	f	\N	f	t	\N	\N	none	1
28089	BIJOUTERI ANILLO ESTRELLA		00200	550.00	1000.00	1.000	56	/uploads/00200.jpg	2026-01-12 15:56:00.224232-03	2026-01-17 11:39:28.031002-03	f	\N	f	t	\N	\N	none	1
28090	BIJOUTERI ANILLO AJUSTABLE		00112	1320.00	2200.00	1.000	56	/uploads/00112.jpg	2026-01-12 15:56:00.226755-03	2026-01-17 11:39:28.033215-03	f	\N	f	t	\N	\N	none	1
28092	BIJOUTERI PULSERA BOLITAS		042	3850.00	6500.00	1.000	56	/uploads/042.jpg	2026-01-12 15:56:00.232243-03	2026-01-17 11:39:28.039187-03	f	\N	f	t	\N	\N	none	1
28093	BIJOUTERI PULSERA CORAZON BOLITAS Y LUNITAS		0042	3190.00	5500.00	1.000	56	/uploads/0042.jpg	2026-01-12 15:56:00.235772-03	2026-01-17 11:39:28.04301-03	f	\N	f	t	\N	\N	none	1
28094	BIJOUTERI AROS CORAZON Y REDONDOS		0052	1045.00	1800.00	4.000	56	/uploads/0052.jpg	2026-01-12 15:56:00.238183-03	2026-01-17 11:39:28.045739-03	f	\N	f	t	\N	\N	none	1
28095	BIJOUTERI ARITO CORAZON ABRIDOR		0009	550.00	1000.00	1.000	56	/uploads/0009.jpg	2026-01-12 15:56:00.240712-03	2026-01-17 11:39:28.048233-03	f	\N	f	t	\N	\N	none	1
28097	BIJOUTERI LIMAS UÑAS		4768	1100.00	1900.00	1.000	56	/uploads/4768.jpg	2026-01-12 15:56:00.245985-03	2026-01-17 11:39:28.052915-03	f	\N	f	t	\N	\N	none	1
28098	PERFUMERIA APARATO  DECO SAPHIRUS		17839	8622.90	13150.00	1.000	33	/uploads/17839.jpg	2026-01-12 15:56:00.248503-03	2026-01-17 11:39:28.055932-03	f	\N	f	t	\N	\N	none	1
28100	GALLETITAS PASEO CLASICAS		7792180006448	826.10	1450.00	3.000	25	/uploads/7792180006448.jpg	2026-01-12 15:56:00.252895-03	2026-01-17 11:39:28.059389-03	f	\N	f	t	\N	\N	none	1
28102	CHOCOLATES HAMLET CHOCOLATE		7794612066211	311.30	450.00	6.000	32	/uploads/7794612066211.jpg	2026-01-12 15:56:00.257434-03	2026-01-17 11:39:28.066269-03	f	\N	f	t	\N	\N	none	1
28103	CONDIMENTOS CANELA MOLIDA		CANELAAAA	1029.60	1350.00	-4.000	14	/uploads/CANELAAAA.jpg	2026-01-12 15:56:00.260199-03	2026-01-17 11:39:28.068906-03	f	\N	f	t	\N	\N	none	1
28104	ABI MATE RAICES		779	7170.90	9780.00	1.000	54	/uploads/779.jpg	2026-01-12 15:56:00.262654-03	2026-01-17 11:39:28.071444-03	f	\N	f	t	\N	\N	none	1
28105	ABI YERBERA Y AZUCARERA		999	2336.40	3200.00	1.000	54	/uploads/999.jpg	2026-01-12 15:56:00.265629-03	2026-01-17 11:39:28.073876-03	f	\N	f	t	\N	\N	none	1
28108	ABI VASOS RAYADOS BAMBU		74639	1732.50	2600.00	2.000	54	/uploads/74639.jpg	2026-01-12 15:56:00.272501-03	2026-01-17 11:39:28.081904-03	f	\N	f	t	\N	\N	none	1
28109	ABI VASO XL MIAMI		187473	2167.00	3000.00	0.000	54	/uploads/187473.jpg	2026-01-12 15:56:00.274725-03	2026-01-17 11:39:28.085953-03	f	\N	f	t	\N	\N	none	1
28110	ABI TAZA RAYA XL		6479272	4169.00	5300.00	-1.000	54	/uploads/6479272.jpg	2026-01-12 15:56:00.276953-03	2026-01-17 11:39:28.089789-03	f	\N	f	t	\N	\N	none	1
28111	ABI TAZON PERSONAJE		6742	5107.30	7400.00	0.000	54	/uploads/6742.jpg	2026-01-12 15:56:00.279374-03	2026-01-17 11:39:28.094392-03	f	\N	f	t	\N	\N	none	1
28112	ABI VASOS REFILL		847862	1599.40	2200.00	1.000	54	/uploads/847862.jpg	2026-01-12 15:56:00.281582-03	2026-01-17 11:39:28.097432-03	f	\N	f	t	\N	\N	none	1
28099	GALLETITAS OREO BAÑADA		7622201745608	2242.00	7570.13	0.000	25	/uploads/7622201745608.jpg	2026-01-12 15:56:00.250801-03	2026-01-12 15:56:00.250801-03	f	\N	f	t	\N	\N	none	1
28113	ABI VASOS KINA		445546	1207.80	1700.00	3.000	54	/uploads/445546.jpg	2026-01-12 15:56:00.285228-03	2026-01-17 11:39:28.099828-03	f	\N	f	t	\N	\N	none	1
28115	ABI VASO FIESTA		75262	1324.40	2150.00	3.000	54	/uploads/75262.jpg	2026-01-12 15:56:00.292341-03	2026-01-17 11:39:28.107804-03	f	\N	f	t	\N	\N	none	1
28117	ABI TAZA CAFETERA		9743	1993.20	2720.00	2.000	54	/uploads/9743.jpg	2026-01-12 15:56:00.3003-03	2026-01-17 11:39:28.11088-03	f	\N	f	t	\N	\N	none	1
28120	ABI SORBETES X UNIDAD		4829	85.80	600.00	9.000	54	/uploads/4829.jpg	2026-01-12 15:56:00.310767-03	2026-01-17 11:39:28.113801-03	f	\N	f	t	\N	\N	none	1
28122	ABI MANITOS X UNIDAD		36292	144.10	300.00	10.000	54	/uploads/36292.jpg	2026-01-12 15:56:00.355047-03	2026-01-17 11:39:28.117966-03	f	\N	f	t	\N	\N	none	1
28106	ABI LIBRETAS ANILLADAS		00098	1981.00	10057.50	-2.000	54	/uploads/00098.jpg	2026-01-12 15:56:00.267962-03	2026-01-12 15:56:00.267962-03	f	\N	f	t	\N	\N	none	1
28123	GASEOSAS COCA COLA 1L		7790895001413	1768.80	2300.00	-4.000	49	/uploads/7790895001413.jpg	2026-01-12 15:56:00.35942-03	2026-01-17 11:39:28.12304-03	f	\N	f	t	\N	\N	none	1
28125	GALLETITAS PORTEÑITAS		PORT112222	1031.80	1350.00	3.000	25	/uploads/PORT112222.jpg	2026-01-12 15:56:00.367097-03	2026-01-17 11:39:28.133173-03	f	\N	f	t	\N	\N	none	1
28126	GOLOSINAS REGALIZ BULL DOG ACIDOS		BULLDOG1111	756.80	1000.00	1.000	18	/uploads/BULLDOG1111.jpg	2026-01-12 15:56:00.370024-03	2026-01-17 11:39:28.137946-03	f	\N	f	t	\N	\N	none	1
28127	ALMACEN SAL TRESAL FINA		SALLLLL	480.70	650.00	18.000	21	/uploads/SINSALLLLLL.jpg	2026-01-12 15:56:00.373552-03	2026-01-17 11:39:28.142893-03	f	\N	f	t	\N	\N	none	1
28128	VERDULERIA VERDEO		VERDEOOOO	5500.00	6500.00	1.000	27	/uploads/VERDEOOOO.jpg	2026-01-12 15:56:00.376026-03	2026-01-17 11:39:28.147858-03	f	\N	f	t	\N	\N	none	1
28130	VERDULERIA PUERRO		PURROOOO	2200.00	3500.00	-1.600	27	/uploads/PURROOOO.jpg	2026-01-12 15:56:00.380717-03	2026-01-17 11:39:28.157313-03	f	\N	f	t	\N	\N	none	1
28131	VERDULERIA PEREJIL		PEREJILLLL	3300.00	4200.00	0.930	27	/uploads/PEREJILLLL.jpg	2026-01-12 15:56:00.383796-03	2026-01-17 11:39:28.161697-03	f	\N	f	t	\N	\N	none	1
28116	ABI BOTELLA MINI PICO		278483	2378.00	12150.00	2.000	54	/uploads/278483.jpg	2026-01-12 15:56:00.296685-03	2026-01-12 15:56:00.296685-03	f	\N	f	t	\N	\N	none	1
28132	ART.LIMPIEZA JABON DE MANO ALGABO		JABONNNNNN	0.00	0.00	0.000	29	/uploads/JABONNNNNN.jpg	2026-01-12 15:56:00.387898-03	2026-01-17 11:39:28.165583-03	f	\N	f	t	\N	\N	none	1
28119	ABI ABRIDOR RECTANGULAR		737292	4813.00	17988.75	1.000	54	/uploads/737292.jpg	2026-01-12 15:56:00.306922-03	2026-01-12 15:56:00.306922-03	f	\N	f	t	\N	\N	none	1
28135	FARMACIA ACTRON PLUS  X8		ACTRONNNN	349.80	550.00	-6.000	30	\N	2026-01-12 15:56:00.397917-03	2026-01-17 11:39:28.180177-03	f	\N	f	t	\N	\N	none	1
28121	ABI CUCHARIAS X UNIDAD		39681	132.00	1350.00	5.000	54	/uploads/39681.jpg	2026-01-12 15:56:00.315114-03	2026-01-12 15:56:00.315114-03	f	\N	f	t	\N	\N	none	1
28136	FARMACIA CARAMELOS C/ANTIBIOTICO		CARAMELOOSS	260.70	400.00	9.000	30	\N	2026-01-12 15:56:00.400225-03	2026-01-17 11:39:28.185274-03	f	\N	f	t	\N	\N	none	1
28137	FARMACIA CARAMELO BUCOANGIN X 9		CARAMMELOO	504.90	700.00	9.000	30	\N	2026-01-12 15:56:00.403394-03	2026-01-17 11:39:28.189673-03	f	\N	f	t	\N	\N	none	1
28138	ART VARIOS GLOBOS X 50 PERLADOS		GLOBOSSSSS	58.30	100.00	94.000	39	/uploads/GLOBOSSSSSS.jpg	2026-01-12 15:56:00.407072-03	2026-01-17 11:39:28.193122-03	f	\N	f	t	\N	\N	none	1
28139	ART VARIOS ANILINA COLIBRI		ANILINAAA	1438.80	2500.00	7.000	39	\N	2026-01-12 15:56:00.410468-03	2026-01-17 11:39:28.197652-03	f	\N	f	t	\N	\N	none	1
28140	ART VARIOS BROCHES PLASTICOS X12		BROCHESSS	1918.40	2400.00	5.000	39	/uploads/BROCHESSS.jpg	2026-01-12 15:56:00.412954-03	2026-01-17 11:39:28.202617-03	f	\N	f	t	\N	\N	none	1
28141	ART VARIOS ABRELATAS		ABRELATASSS	531.30	850.00	0.000	39	\N	2026-01-12 15:56:00.41511-03	2026-01-17 11:39:28.206167-03	f	\N	f	t	\N	\N	none	1
28142	ART VARIOS GLOBOS COLORES FELIZ CUMPLE		GLOBOSSSSSS	50.60	100.00	-97.000	39	/uploads/GLOBOSSSSSS.jpg	2026-01-12 15:56:00.417289-03	2026-01-17 11:39:28.209353-03	f	\N	f	t	\N	\N	none	1
28143	ART VARIOS CORDONES X 80 CM		CORDONESSSS	143.00	300.00	23.000	39	\N	2026-01-12 15:56:00.420503-03	2026-01-17 11:39:28.212464-03	f	\N	f	t	\N	\N	none	1
28144	ART VARIOS CORDONES X 1.10 CM		CORDONESSSSSS	151.80	400.00	1.000	39	\N	2026-01-12 15:56:00.423864-03	2026-01-17 11:39:28.214839-03	f	\N	f	t	\N	\N	none	1
28146	ART.LIMPIEZA CIF AEROSOL		CIFFF	0.00	0.00	0.000	29	/uploads/CIFFF.jpg	2026-01-12 15:56:00.433642-03	2026-01-17 11:39:28.220066-03	f	\N	f	t	\N	\N	none	1
28147	ART.LIMPIEZA FLORIPEL COCINA		FLORIPELLLLLO	1012.00	1400.00	7.000	29	\N	2026-01-12 15:56:00.438695-03	2026-01-17 11:39:28.222383-03	f	\N	f	t	\N	\N	none	1
28148	LACTEOS LECHE CONDENSADA		LECHEEEEEEE	2123.00	2650.00	1.000	26	/uploads/LECHEEEEEEE.jpg	2026-01-12 15:56:00.444229-03	2026-01-17 11:39:28.224862-03	f	\N	f	t	\N	\N	none	1
28149	ALMACEN PAN DE SALVADO		PANNNNNNN	1540.00	1900.00	-1.650	21	/uploads/PANNNNNNN.jpg	2026-01-12 15:56:00.450115-03	2026-01-17 11:39:28.228717-03	f	\N	f	t	\N	\N	none	1
28150	LACTEOS POSTRE LS		LACTEOS	1018.60	1300.00	-5.000	26	/uploads/LACTEOS.jpg	2026-01-12 15:56:00.454419-03	2026-01-17 11:39:28.232142-03	f	\N	f	t	\N	\N	none	1
28151	ALMACEN ANCHOAS		ANCHOASSSSSS	1701.70	2100.00	0.000	21	/uploads/ANCHOASSSSSS.jpg	2026-01-12 15:56:00.458821-03	2026-01-17 11:39:28.235382-03	f	\N	f	t	\N	\N	none	1
28152	ALMACEN POLENTA MONARCA		POLENTAAA	266.20	400.00	9.000	21	\N	2026-01-12 15:56:00.4641-03	2026-01-17 11:39:28.238258-03	f	\N	f	t	\N	\N	none	1
28155	ALMACEN PALITO SALADO SUELTO		PALITOOOOO	4788.30	7500.00	1.490	21	/uploads/PALITOOOOO.jpg	2026-01-12 15:56:00.47844-03	2026-01-17 11:39:28.244707-03	f	\N	f	t	\N	\N	none	1
28157	BODEGA FERNANDITO  MANAOS		FERNEEEE	1072.50	1500.00	0.000	37	/uploads/FERNEEEE.jpg	2026-01-12 15:56:00.483731-03	2026-01-17 11:39:28.249748-03	f	\N	f	t	\N	\N	none	1
28159	ALMACEN YOGUR REMOLAC X 125		YOGURRRR	385.00	500.00	0.000	21	/uploads/YOGURRRR.jpg	2026-01-12 15:56:00.48784-03	2026-01-17 11:39:28.256692-03	f	\N	f	t	\N	\N	none	1
28161	ALMACEN PIKLES MIXTOS		PIKLESSSSS	1074.70	1350.00	-1.000	21	/uploads/PIKLESSSSS.jpg	2026-01-12 15:56:00.492129-03	2026-01-17 11:39:28.260278-03	f	\N	f	t	\N	\N	none	1
28162	ALMACEN TE HIERBAS		TEEEEEE	959.20	1200.00	2.000	21	/uploads/GILLETEEEEEE.jpg	2026-01-12 15:56:00.494213-03	2026-01-17 11:39:28.263118-03	f	\N	f	t	\N	\N	none	1
28163	ALMACEN SALSA GOLF		SALSAAAAAA	619.30	1000.00	1.000	21	/uploads/SALSAAAAAA.jpg	2026-01-12 15:56:00.497232-03	2026-01-17 11:39:28.265621-03	f	\N	f	t	\N	\N	none	1
28165	JUGUETES ZOE BICICLETA		JUGUETES002	13200.00	19000.00	1.000	58	/uploads/JUGUETES002.jpg	2026-01-12 15:56:00.50282-03	2026-01-17 11:39:28.27107-03	f	\N	f	t	\N	\N	none	1
28166	JUGUETES BARBIE MOTO AGUA		JUGUETES003	12100.00	18000.00	0.000	58	/uploads/JUGUETES003.jpg	2026-01-12 15:56:00.505188-03	2026-01-17 11:39:28.274294-03	f	\N	f	t	\N	\N	none	1
28167	JUGUETES TINY MASCOTA		JUGUETES004	5500.00	10000.00	0.000	58	/uploads/JUGUETES004.jpg	2026-01-12 15:56:00.507342-03	2026-01-17 11:39:28.27763-03	f	\N	f	t	\N	\N	none	1
28169	JUGUETES TINI MAMA		JUGUETES006	10450.00	20000.00	1.000	58	/uploads/JUGUETES006.jpg	2026-01-12 15:56:00.513132-03	2026-01-17 11:39:28.284015-03	f	\N	f	t	\N	\N	none	1
28170	JUGUETES BEAUTIFUL		JUGUETES007	4180.00	7000.00	0.000	58	/uploads/JUGUETES007.jpg	2026-01-12 15:56:00.516403-03	2026-01-17 11:39:28.286794-03	f	\N	f	t	\N	\N	none	1
28171	JUGUETES ZOE FUTBOLISTA		JUGUETES008	6600.00	12000.00	2.000	58	/uploads/JUGUETES008.jpg	2026-01-12 15:56:00.518756-03	2026-01-17 11:39:28.289372-03	f	\N	f	t	\N	\N	none	1
28154	BEBIDA COCA X 1.75		COCAAAAA	1852.00	9956.25	3.000	19	/uploads/COCAAAAA.jpg	2026-01-12 15:56:00.474294-03	2026-01-12 15:56:00.474294-03	f	\N	f	t	\N	\N	none	1
28172	JUGUETES TINY FANTASI		JUGUETES009	4950.00	10000.00	1.000	58	/uploads/JUGUETES009.jpg	2026-01-12 15:56:00.521033-03	2026-01-17 11:39:28.29174-03	f	\N	f	t	\N	\N	none	1
28174	JUGUETES FROZEN		JUGUETES011	3630.00	7000.00	1.000	58	/uploads/JUGUETES011.jpg	2026-01-12 15:56:00.526294-03	2026-01-17 11:39:28.297528-03	f	\N	f	t	\N	\N	none	1
28175	JUGUETES BEAUTY		JUGUETES012	2420.00	5000.00	1.000	58	/uploads/JUGUETES012.jpg	2026-01-12 15:56:00.529243-03	2026-01-17 11:39:28.30037-03	f	\N	f	t	\N	\N	none	1
28176	JUGUETES TINY BIJOU		JUGUETES013	3300.00	6000.00	-2.000	58	/uploads/JUGUETES013.jpg	2026-01-12 15:56:00.532191-03	2026-01-17 11:39:28.30384-03	f	\N	f	t	\N	\N	none	1
28160	MASCOTAS VITAL CAN PREMIUNNNN		MASCOTASSSSSSS	19100.00	69187.50	0.000	28	/uploads/MASCOTASSSSSSS.jpg	2026-01-12 15:56:00.489882-03	2026-01-12 15:56:00.489882-03	f	\N	f	t	\N	\N	none	1
28177	JUGUETES BEAUTIFUL BEADS		JUGUETES014	1760.00	3000.00	-2.000	58	/uploads/JUGUETES014.jpg	2026-01-12 15:56:00.535915-03	2026-01-17 11:39:28.307195-03	f	\N	f	t	\N	\N	none	1
28179	JUGUETES SONAJEROS BEBE		JUGUETES0016	2420.00	4500.00	2.000	58	/uploads/JUGUETES0016.jpg	2026-01-12 15:56:00.542477-03	2026-01-17 11:39:28.313041-03	f	\N	f	t	\N	\N	none	1
28180	JUGUETES CASITA PARA ARMAR		JUGUETES017	2750.00	4500.00	1.000	58	/uploads/JUGUETES017.jpg	2026-01-12 15:56:00.545447-03	2026-01-17 11:39:28.315608-03	f	\N	f	t	\N	\N	none	1
28181	JUGUETES ESLIME FRUTAS		JUGUETES018	330.00	800.00	11.000	58	/uploads/JUGUETES018.jpg	2026-01-12 15:56:00.548787-03	2026-01-17 11:39:28.31826-03	f	\N	f	t	\N	\N	none	1
28182	JUGUETES ESLIME GLACIER		JUGUETES019	330.00	800.00	-2.000	58	/uploads/JUGUETES019.jpg	2026-01-12 15:56:00.553322-03	2026-01-17 11:39:28.320824-03	f	\N	f	t	\N	\N	none	1
28184	JUGUETES SUPER HEROES		JUGUETES022	6600.00	12000.00	1.000	58	/uploads/JUGUETES022.jpg	2026-01-12 15:56:00.560681-03	2026-01-17 11:39:28.325621-03	f	\N	f	t	\N	\N	none	1
28185	JUGUETES ARMA TOY STORY		JUGUETES023	7700.00	12000.00	-1.000	58	/uploads/JUGUETES023.jpg	2026-01-12 15:56:00.5646-03	2026-01-17 11:39:28.328787-03	f	\N	f	t	\N	\N	none	1
28186	JUGUETES AUTO LUMINOSO		JUGUETES024	8800.00	16000.00	1.000	58	/uploads/JUGUETES024.jpg	2026-01-12 15:56:00.568202-03	2026-01-17 11:39:28.332033-03	f	\N	f	t	\N	\N	none	1
28187	JUGUETES MISTER SHOCK		JUGUETES025	11000.00	18000.00	1.000	58	/uploads/JUGUETES025.jpg	2026-01-12 15:56:00.573147-03	2026-01-17 11:39:28.336952-03	f	\N	f	t	\N	\N	none	1
28189	JUGUETES JUEGO DE AJEDREZ GRANDE		JUGUETES027	3630.00	7000.00	1.000	58	/uploads/JUGUETES027.jpg	2026-01-12 15:56:00.580781-03	2026-01-17 11:39:28.342711-03	f	\N	f	t	\N	\N	none	1
28190	JUGUETES CRUZANDO PALABRAS		JUGUETES028	5500.00	8500.00	0.000	58	/uploads/JUGUETES028.jpg	2026-01-12 15:56:00.584255-03	2026-01-17 11:39:28.345264-03	f	\N	f	t	\N	\N	none	1
28191	JUGUETES EL JUEGO DE LA OCA		JUGUETES029	3630.00	7000.00	0.000	58	/uploads/JUGUETES029.jpg	2026-01-12 15:56:00.58753-03	2026-01-17 11:39:28.347769-03	f	\N	f	t	\N	\N	none	1
28192	JUGUETES JUEGO DE AJEDREZ CHICO		JUGUETES030	2530.00	4500.00	0.000	58	/uploads/JUGUETES030.jpg	2026-01-12 15:56:00.590514-03	2026-01-17 11:39:28.350316-03	f	\N	f	t	\N	\N	none	1
28194	JUGUETES DINOSAURIOS SUPER CARS		JUGUETES032	6050.00	9500.00	1.000	58	/uploads/JUGUETES032.jpg	2026-01-12 15:56:00.594866-03	2026-01-17 11:39:28.357181-03	f	\N	f	t	\N	\N	none	1
28195	JUGUETES BLISTER AUTITOS AVION MOTO		JUGUETES033	1870.00	3000.00	1.000	58	/uploads/JUGUETES033.jpg	2026-01-12 15:56:00.596957-03	2026-01-17 11:39:28.360389-03	f	\N	f	t	\N	\N	none	1
28196	JUGUETES BLISTER CAMIONCITOS X 4		JUGUETES034	2200.00	4000.00	1.000	58	/uploads/JUGUETES034.jpg	2026-01-12 15:56:00.599542-03	2026-01-17 11:39:28.363274-03	f	\N	f	t	\N	\N	none	1
28197	JUGUETES HAMBURGUESA		JUGUETES035	1870.00	3000.00	0.000	58	/uploads/JUGUETES035.jpg	2026-01-12 15:56:00.60211-03	2026-01-17 11:39:28.367306-03	f	\N	f	t	\N	\N	none	1
28199	LIBRERIA PLASTILINA		PLASTILINAAAAA	1320.00	2400.00	6.000	59	/uploads/PLASTILINAAAAA.jpg	2026-01-12 15:56:00.607974-03	2026-01-17 11:39:28.377256-03	f	\N	f	t	\N	\N	none	1
28200	ART VARIOS PEINE		PEINEEE	183.70	350.00	4.000	39	/uploads/PEINEEEESSS.jpg	2026-01-12 15:56:00.610403-03	2026-01-17 11:39:28.382197-03	f	\N	f	t	\N	\N	none	1
28201	ART VARIOS PEINE BOLCILLO		PEINEEEEEEER	71.50	250.00	12.000	39	\N	2026-01-12 15:56:00.613018-03	2026-01-17 11:39:28.387229-03	f	\N	f	t	\N	\N	none	1
28202	ART VARIOS MANTECA DE CACAO		MANTECACACAOOOOO	576.40	800.00	2.000	39	/uploads/MANTECACACAOOOOO.jpg	2026-01-12 15:56:00.615237-03	2026-01-17 11:39:28.390467-03	f	\N	f	t	\N	\N	none	1
28203	ART VARIOS AGUA OXIGENADA MEDICONAL		AGUAOXIGENADA	344.30	600.00	0.000	39	/uploads/AGUAOXIGENADA.jpg	2026-01-12 15:56:00.617382-03	2026-01-17 11:39:28.393636-03	f	\N	f	t	\N	\N	none	1
28205	LIBRERIA VIROMES		VIROMEEEEE	619.30	800.00	-31.000	59	/uploads/VIROMEEEEEEE.jpg	2026-01-12 15:56:00.621859-03	2026-01-17 11:39:28.4016-03	f	\N	f	t	\N	\N	none	1
28206	ART VARIOS CINTA SCOCH		CINTASCOCHHHH	206.80	300.00	1.000	39	/uploads/CINTASCOCHHHH.jpg	2026-01-12 15:56:00.623963-03	2026-01-17 11:39:28.405837-03	f	\N	f	t	\N	\N	none	1
28207	ART VARIOS CREMA DE AFEITAR		CTEMAAAAAA	4250.40	5250.00	3.000	39	/uploads/CTEMAAAAAA.jpg	2026-01-12 15:56:00.62687-03	2026-01-17 11:39:28.410419-03	f	\N	f	t	\N	\N	none	1
28208	JUGUETES L ERA DE LOS DINOSAURIOS		JUGUETES036	2200.00	3000.00	0.000	58	/uploads/JUGUETES036.jpg	2026-01-12 15:56:00.629181-03	2026-01-17 11:39:28.416214-03	f	\N	f	t	\N	\N	none	1
28210	JUGUETES CUBO MAGICO X 4		JUGUETES038	1430.00	2000.00	1.000	58	/uploads/JUGUETES038.jpg	2026-01-12 15:56:00.634949-03	2026-01-17 11:39:28.421882-03	f	\N	f	t	\N	\N	none	1
28211	JUGUETES CUBO MAGICO X 9		JUGUETES039	2200.00	3000.00	-3.000	58	/uploads/JUGUETES039.jpg	2026-01-12 15:56:00.638324-03	2026-01-17 11:39:28.424255-03	f	\N	f	t	\N	\N	none	1
28212	JUGUETES Y VOS....QUE SOS?  JUEGO DE MESA		JUGUETES040	2420.00	4500.00	0.000	58	/uploads/JUGUETES040.jpg	2026-01-12 15:56:00.642266-03	2026-01-17 11:39:28.426764-03	f	\N	f	t	\N	\N	none	1
28214	JUGUETES DIBÙJALO		JUGUETES042	2420.00	4500.00	0.000	58	/uploads/JUGUETES042.jpg	2026-01-12 15:56:00.649899-03	2026-01-17 11:39:28.432081-03	f	\N	f	t	\N	\N	none	1
28215	JUGUETES CASITA ROBADA		JUGUETES043	2420.00	4500.00	2.000	58	/uploads/JUGUETES043.jpg	2026-01-12 15:56:00.653059-03	2026-01-17 11:39:28.435548-03	f	\N	f	t	\N	\N	none	1
28216	JUGUETES VERDAD CONSECUENCIA		JUGUETES044	2420.00	4500.00	0.000	58	/uploads/JUGUETES044.jpg	2026-01-12 15:56:00.656455-03	2026-01-17 11:39:28.438236-03	f	\N	f	t	\N	\N	none	1
28218	JUGUETES CARTAS EL UNO		JUGUETES046	1650.00	2500.00	-3.000	58	/uploads/JUGUETES046.jpg	2026-01-12 15:56:00.664341-03	2026-01-17 11:39:28.443856-03	f	\N	f	t	\N	\N	none	1
28219	JUGUETES CARTAS EL UNO FLIP		JUGUETES047	1650.00	2500.00	-4.000	58	/uploads/JUGUETES047.jpg	2026-01-12 15:56:00.668477-03	2026-01-17 11:39:28.448503-03	f	\N	f	t	\N	\N	none	1
28220	JUGUETES CARTAS ESPAÑOLAS		JUGUETES048	1100.00	2000.00	0.000	58	/uploads/JUGUETES048.jpg	2026-01-12 15:56:00.671925-03	2026-01-17 11:39:28.453372-03	f	\N	f	t	\N	\N	none	1
28221	JUGUETES PONY CHICO		JUGUETES049	1980.00	2500.00	-1.000	58	/uploads/JUGUETES049.jpg	2026-01-12 15:56:00.675343-03	2026-01-17 11:39:28.457913-03	f	\N	f	t	\N	\N	none	1
28223	JUGUETES AUTO CARS		JUGUETES052	2970.00	4000.00	0.000	58	/uploads/JUGUETES052.jpg	2026-01-12 15:56:00.681495-03	2026-01-17 11:39:28.472564-03	f	\N	f	t	\N	\N	none	1
28224	JUGUETES ARMA SUPER POLICE		JUGUETES054	2420.00	4500.00	-1.000	58	/uploads/JUGUETES054.jpg	2026-01-12 15:56:00.684936-03	2026-01-17 11:39:28.481365-03	f	\N	f	t	\N	\N	none	1
28225	JUGUETES CAZA PESCADITOS		JUGUETES056	3080.00	4500.00	2.000	58	/uploads/JUGUETES056.jpg	2026-01-12 15:56:00.688227-03	2026-01-17 11:39:28.485882-03	f	\N	f	t	\N	\N	none	1
28226	JUGUETES BLISTER DE AUTOS X 4		JUGUETES057	2860.00	4500.00	-3.000	58	/uploads/JUGUETES057.jpg	2026-01-12 15:56:00.691335-03	2026-01-17 11:39:28.490247-03	f	\N	f	t	\N	\N	none	1
28228	JUGUETES TRANSFORME		JUGUETES051	2750.00	3800.00	0.000	58	/uploads/JUGUETES051.jpg	2026-01-12 15:56:00.698078-03	2026-01-17 11:39:28.498554-03	f	\N	f	t	\N	\N	none	1
28229	JUGUETES LANZA DARDO		JUGUETES055	3300.00	4500.00	1.000	58	/uploads/JUGUETES055.jpg	2026-01-12 15:56:00.702693-03	2026-01-17 11:39:28.503981-03	f	\N	f	t	\N	\N	none	1
28230	JUGUETES BABIE TINY		JUGUETES059	2970.00	5000.00	2.000	58	/uploads/JUGUETES059.jpg	2026-01-12 15:56:00.70691-03	2026-01-17 11:39:28.509061-03	f	\N	f	t	\N	\N	none	1
28231	JUGUETES PONY GRANDE		JUGUETES050	2200.00	3000.00	0.000	58	/uploads/JUGUETES050.jpg	2026-01-12 15:56:00.710446-03	2026-01-17 11:39:28.513873-03	f	\N	f	t	\N	\N	none	1
28233	JUGUETES SONAJEROS		JUGUETES016	2420.00	4500.00	2.000	58	/uploads/JUGUETES016.jpg	2026-01-12 15:56:00.716036-03	2026-01-17 11:39:28.522357-03	f	\N	f	t	\N	\N	none	1
28234	JUGUETES AUTO CON CONTROL REMOTO		JUGUETES061	8800.00	15000.00	-1.000	58	/uploads/JUGUETES061.jpg	2026-01-12 15:56:00.718293-03	2026-01-17 11:39:28.527469-03	f	\N	f	t	\N	\N	none	1
28235	JUGUETES PERRITO VETERINARIA		JUGUETES062	14300.00	20000.00	0.000	58	/uploads/JUGUETES062.jpg	2026-01-12 15:56:00.720564-03	2026-01-17 11:39:28.531703-03	f	\N	f	t	\N	\N	none	1
28236	JUGUETES BARBIE DEFA LUCY		JUGUETES063	9900.00	18000.00	1.000	58	/uploads/JUGUETES063.jpg	2026-01-12 15:56:00.72263-03	2026-01-17 11:39:28.537197-03	f	\N	f	t	\N	\N	none	1
28238	JUGUETES JUGETE PINTURITA		JUGUETE070	3080.00	4000.00	-1.000	58	/uploads/JUGUETE070.jpg	2026-01-12 15:56:00.726823-03	2026-01-17 11:39:28.545055-03	f	\N	f	t	\N	\N	none	1
28239	CONGELADOS HAMBURGUESAS COMBO		COMBOOOOO	3366.00	4100.00	5.000	17	/uploads/COMBOOOOO.jpg	2026-01-12 15:56:00.729112-03	2026-01-17 11:39:28.54842-03	f	\N	f	t	\N	\N	none	1
28240	CONGELADOS HAMBURG 214 X 2 UNIDADES		HAMBURGESASSSS	1733.60	2250.00	2.000	17	\N	2026-01-12 15:56:00.731381-03	2026-01-17 11:39:28.551725-03	f	\N	f	t	\N	\N	none	1
28241	JUGUETES PELOTAS		JUGUETES071	6600.00	13000.00	2.000	58	/uploads/JUGUETES071.jpg	2026-01-12 15:56:00.734419-03	2026-01-17 11:39:28.555101-03	f	\N	f	t	\N	\N	none	1
28242	JUGUETES TABLETAS		JUGUETES072	3080.00	5000.00	0.000	58	/uploads/JUGUETES072.jpg	2026-01-12 15:56:00.737354-03	2026-01-17 11:39:28.557794-03	f	\N	f	t	\N	\N	none	1
28244	CIGARRILLOS MARLBORO  COMUN DE 20		MALLBOROOOOO	5390.00	5400.00	1.000	51	/uploads/MALLBOROOOOO.jpg	2026-01-12 15:56:00.742384-03	2026-01-17 11:39:28.56275-03	f	\N	f	t	\N	\N	none	1
28245	CIGARRILLOS PHILIPMORRIS COMUN X20 28%		PHILIPMORRIS	4851.00	5100.00	13.000	51	/uploads/PHILIPMORRIS.jpg	2026-01-12 15:56:00.744551-03	2026-01-17 11:39:28.565048-03	f	\N	f	t	\N	\N	none	1
28246	CIGARRILLOS MELBOURNE		MELBOURNEEEE	1410.20	1600.00	5.000	51	/uploads/MELBOURNEEEE.jpg	2026-01-12 15:56:00.746944-03	2026-01-17 11:39:28.567437-03	f	\N	f	t	\N	\N	none	1
28249	ART VARIOS PEINE CASPERO		PEINEEEESSS	92.40	250.00	11.000	39	/uploads/PEINEEEESSS.jpg	2026-01-12 15:56:00.755609-03	2026-01-17 11:39:28.573187-03	f	\N	f	t	\N	\N	none	1
28250	LIBRERIA COLORES FILGO  CORTOS X6		COLORESSSSS	462.00	650.00	6.000	59	/uploads/COLORESSSSS.jpg	2026-01-12 15:56:00.758176-03	2026-01-17 11:39:28.576673-03	f	\N	f	t	\N	\N	none	1
28251	LIBRERIA COLORES FILGO CORTOS X12		COLORESSSSD	946.00	1300.00	2.000	59	/uploads/COLORESSSSD.jpg	2026-01-12 15:56:00.761696-03	2026-01-17 11:39:28.579768-03	f	\N	f	t	\N	\N	none	1
28252	LIBRERIA COLORES FILGO LARGOS X12		COLORESSSSSSSSS	1006.50	1600.00	0.000	59	/uploads/COLORESSSSSSSSS.jpg	2026-01-12 15:56:00.805256-03	2026-01-17 11:39:28.583167-03	f	\N	f	t	\N	\N	none	1
28254	LIBRERIA GOMA TINTA		GOMAAAAA	380.60	500.00	14.000	59	/uploads/GOMAAAAA.jpg	2026-01-12 15:56:00.8114-03	2026-01-17 11:39:28.589588-03	f	\N	f	t	\N	\N	none	1
28255	LIBRERIA GOMA LAPIZ		GOMAAAAAAAAA	315.70	400.00	-2.000	59	/uploads/GOMAAAAAAAAA.jpg	2026-01-12 15:56:00.815144-03	2026-01-17 11:39:28.592075-03	f	\N	f	t	\N	\N	none	1
28256	ART VARIOS HILO MATAMBRE		HILOOOOOO	292.60	400.00	-4.000	39	/uploads/HILOOOOOO.jpg	2026-01-12 15:56:00.818601-03	2026-01-17 11:39:28.594328-03	f	\N	f	t	\N	\N	none	1
28257	LIBRERIA HOJAS PENTAGRAMA 🎼		HOJASSSSSS	927.30	1140.00	2.000	59	/uploads/HOJASSSSSS.jpg	2026-01-12 15:56:00.822095-03	2026-01-17 11:39:28.597021-03	f	\N	f	t	\N	\N	none	1
28258	CIGARRILLOS MARLBORO CRAFTED		CIGARRILLOSSSSSSS	3091.00	3200.00	-9.000	51	/uploads/CIGARRILLOSSSSSSS.jpg	2026-01-12 15:56:00.826336-03	2026-01-17 11:39:28.599457-03	f	\N	f	t	\N	\N	none	1
28260	ART VARIOS ESPIRAL GORRION		ESPIRALLLLL	512.60	750.00	64.000	39	/uploads/ESPIRALLLLL.jpg	2026-01-12 15:56:00.831928-03	2026-01-17 11:39:28.607571-03	f	\N	f	t	\N	\N	none	1
28261	ALMACEN ALMACEN YOGUR REMOLAC  X 1L		YOGURRRTTT	1381.60	1800.00	4.000	21	\N	2026-01-12 15:56:00.835222-03	2026-01-17 11:39:28.611463-03	f	\N	f	t	\N	\N	none	1
28247	GALLETITAS TERRABUSSI VARIEDAD X 170G		VARIEDADDDD	744.00	3543.75	-2.000	25	/uploads/VARIEDADDDD.jpg	2026-01-12 15:56:00.749647-03	2026-01-12 15:56:00.749647-03	f	\N	f	t	\N	\N	none	1
28262	CIGARRILLOS MARLBORO BOX X20		CIGARRILLOSSSSSSSBOX	5390.00	5600.00	-17.000	51	/uploads/CIGARRILLOSSSSSSSBOX.jpg	2026-01-12 15:56:00.83806-03	2026-01-17 11:39:28.616944-03	f	\N	f	t	\N	\N	none	1
28263	CIGARRILLOS MARLBORO BOX 12		CIGARRILLOSBOXXXX	3542.00	3750.00	12.000	51	/uploads/CIGARRILLOSBOXXXX.jpg	2026-01-12 15:56:00.841309-03	2026-01-17 11:39:28.621715-03	f	\N	f	t	\N	\N	none	1
28264	CIGARRILLOS CHESTERFILD COMUN X20		CIGARRILLOSSSCHES	4114.00	4300.00	10.000	51	/uploads/CIGARRILLOSSSCHES.jpg	2026-01-12 15:56:00.844775-03	2026-01-17 11:39:28.626576-03	f	\N	f	t	\N	\N	none	1
28266	ESMALTES ESMALTES COLORS		ESMALTES0079	2200.00	3200.00	7.000	60	/uploads/ESMALTES0079.jpg	2026-01-12 15:56:00.851528-03	2026-01-17 11:39:28.635534-03	f	\N	f	t	\N	\N	none	1
28267	ART.LIMPIEZA PROCENEX		PROCENEXXXXXX	1372.80	1680.00	0.000	29	/uploads/PROCENEXXXXXX.jpg	2026-01-12 15:56:00.854277-03	2026-01-17 11:39:28.640067-03	f	\N	f	t	\N	\N	none	1
28268	ALMACEN 3D X43G		3DDDDDD	0.00	0.00	0.000	21	/uploads/3DDDDDD.jpg	2026-01-12 15:56:00.857747-03	2026-01-17 11:39:28.644995-03	f	\N	f	t	\N	\N	none	1
28269	ALMACEN DORITOS X 77G		DORITOSSSSSS	2575.10	3200.00	70.000	21	/uploads/DORITOSSSSSS.jpg	2026-01-12 15:56:00.861025-03	2026-01-17 11:39:28.648935-03	f	\N	f	t	\N	\N	none	1
28270	PERFUMERIA ESPUMA DE AFEITAR		GILLETTEEEEEEE	5423.00	5500.00	1.000	33	/uploads/GILLETTEEEEEEE.jpg	2026-01-12 15:56:00.864679-03	2026-01-17 11:39:28.653092-03	f	\N	f	t	\N	\N	none	1
28273	GOLOSINAS RASTA ALFAJOR		RASTAAAAAAA	843.70	1100.00	8.000	18	/uploads/RASTAAAAAAA.jpg	2026-01-12 15:56:00.874351-03	2026-01-17 11:39:28.667621-03	f	\N	f	t	\N	\N	none	1
28274	BEBIDA PEPSI X500		PEPSIIIIIII	542.30	680.00	1.000	19	\N	2026-01-12 15:56:00.878052-03	2026-01-17 11:39:28.670915-03	f	\N	f	t	\N	\N	none	1
28275	PERFUMERIA PERFUME MUJER CASTANHA		COD080	31900.00	34300.00	1.000	33	/uploads/COD080.jpg	2026-01-12 15:56:00.880763-03	2026-01-17 11:39:28.674026-03	f	\N	f	t	\N	\N	none	1
28276	PERFUMERIA PÒS BARBA		COD081	6050.00	6980.00	1.000	33	/uploads/COD081.jpg	2026-01-12 15:56:00.883545-03	2026-01-17 11:39:28.677791-03	f	\N	f	t	\N	\N	none	1
28278	PERFUMERIA CREM TODODIA FRUTOS ROJOS		COD083	8800.00	9000.00	1.000	33	/uploads/COD083.jpg	2026-01-12 15:56:00.890073-03	2026-01-17 11:39:28.68436-03	f	\N	f	t	\N	\N	none	1
28279	PERFUMERIA COLONIA TODODIA BODY SPLASH FRUTOS ROJOS		COD084	20900.00	22300.00	1.000	33	/uploads/COD084.jpg	2026-01-12 15:56:00.893396-03	2026-01-17 11:39:28.687518-03	f	\N	f	t	\N	\N	none	1
28280	PERFUMERIA CREM PARA PIES		COD085	6600.00	7160.00	1.000	33	/uploads/COD085.jpg	2026-01-12 15:56:00.896251-03	2026-01-17 11:39:28.689836-03	f	\N	f	t	\N	\N	none	1
28281	PERFUMERIA ALCOHOL EN GEL X 90GS		COD086	2200.00	2500.00	0.000	33	/uploads/COD086.jpg	2026-01-12 15:56:00.899489-03	2026-01-17 11:39:28.692127-03	f	\N	f	t	\N	\N	none	1
28282	PERFUMERIA CREM PARA MANOS		COD087	4400.00	5210.00	1.000	33	/uploads/COD087.jpg	2026-01-12 15:56:00.903517-03	2026-01-17 11:39:28.694493-03	f	\N	f	t	\N	\N	none	1
28284	PERFUMERIA CREMA PARA CUERPO TODODIA MACADAMIA		COD089	12100.00	14000.00	0.000	33	/uploads/COD089.jpg	2026-01-12 15:56:00.908897-03	2026-01-17 11:39:28.699368-03	f	\N	f	t	\N	\N	none	1
28285	PERFUMERIA COLONIA EKOS  CASTAÑA		COD090	31900.00	34300.00	1.000	33	/uploads/COD090.jpg	2026-01-12 15:56:00.912272-03	2026-01-17 11:39:28.702542-03	f	\N	f	t	\N	\N	none	1
28286	PERFUMERIA CREMA DE MANOS BIOGRAFIA		COD091	4950.00	5500.00	1.000	33	/uploads/COD091.jpg	2026-01-12 15:56:00.914997-03	2026-01-17 11:39:28.705224-03	f	\N	f	t	\N	\N	none	1
28289	ALMACEN PAN RALLADO MAMA COCINA P/HORNO		MAMACOCONAAAAAAAA	990.00	1350.00	-2.000	21	/uploads/MAMACOCONAAAAAAAA.jpg	2026-01-12 15:56:00.923929-03	2026-01-17 11:39:28.710103-03	f	\N	f	t	\N	\N	none	1
28291	LIBRERIA CINTA ANCHAAA		CINTAAAAAAA	1320.00	1650.00	-2.000	59	/uploads/CINTAAAAAAA.jpg	2026-01-12 15:56:00.929574-03	2026-01-17 11:39:28.712255-03	f	\N	f	t	\N	\N	none	1
28292	ALMACEN SALADIX PICANTE		SALADIXPICANTEEEEE	507.10	800.00	27.000	21	/uploads/SALADIXPICANTEEEEE.jpg	2026-01-12 15:56:00.934768-03	2026-01-17 11:39:28.71465-03	f	\N	f	t	\N	\N	none	1
28293	ALMACEN TOSTADAS MANIERI		MANIERIIIIIII	888.80	1300.00	24.000	21	/uploads/MANIERIIIIIII.jpg	2026-01-12 15:56:00.939033-03	2026-01-17 11:39:28.717423-03	f	\N	f	t	\N	\N	none	1
28295	ALMACEN MORTADELA FAMILIAR		MORTADELAAAAAA	3113.00	3800.00	4.000	21	/uploads/MORTADELAAAAAA.jpg	2026-01-12 15:56:00.946053-03	2026-01-17 11:39:28.721831-03	f	\N	f	t	\N	\N	none	1
28296	CIGARRILLOS PHILIP MORRIS BOX DE 20. 22%		CIGARRILLOOOOOOO	5291.00	5500.00	-5.000	51	/uploads/CIGARRILLOOOOOOO.jpg	2026-01-12 15:56:00.949717-03	2026-01-17 11:39:28.724271-03	f	\N	f	t	\N	\N	none	1
28297	CIGARRILLOS CHESTERFIELD		CIGARRILLOSSSSS	4631.00	4900.00	15.000	51	/uploads/CIGARRILLOSSSSS.jpg	2026-01-12 15:56:00.952872-03	2026-01-17 11:39:28.727289-03	f	\N	f	t	\N	\N	none	1
28298	ALMACEN HUEVO X MAPLE		HUEVOOOOOOO	7150.00	8000.00	0.000	21	/uploads/HUEVOOOOOOO.jpg	2026-01-12 15:56:00.955187-03	2026-01-17 11:39:28.729569-03	f	\N	f	t	\N	\N	none	1
28299	ALMACEN BERENJENA		0098	3300.00	4100.00	-3.000	21	/uploads/0098.jpg	2026-01-12 15:56:00.957468-03	2026-01-17 11:39:28.731693-03	f	\N	f	t	\N	\N	none	1
28301	NATURA CREMA CORPORAL		0002	12100.00	13600.00	1.000	61	/uploads/0002.jpg	2026-01-12 15:56:00.96354-03	2026-01-17 11:39:28.736239-03	f	\N	f	t	\N	\N	none	1
28287	ALMACEN MATE COCIDO ROSA MONTE		ROSAMONTEEEEE	606.00	3375.00	3.000	21	/uploads/ROSAMONTEEEEE.jpg	2026-01-12 15:56:00.918826-03	2026-01-12 15:56:00.918826-03	f	\N	f	t	\N	\N	none	1
28302	NATURA JABON LIQUIDO		0004	4950.00	5180.00	1.000	61	/uploads/0004.jpg	2026-01-12 15:56:00.966257-03	2026-01-17 11:39:28.73884-03	f	\N	f	t	\N	\N	none	1
28290	GOLOSINAS ALFAJOR RASTA BCO		RASTAAAAAAAASSS	740.00	4050.00	-62.000	18	/uploads/RASTAAAAAAAASSS.jpg	2026-01-12 15:56:00.926764-03	2026-01-12 15:56:00.926764-03	f	\N	f	t	\N	\N	none	1
28305	ART VARIOS PLANTILLA DEL 34 AL 45		PLANTLLASSSSSS	825.00	1100.00	9.000	39	/uploads/PLANTLLASSSSSS.jpg	2026-01-12 15:56:00.972771-03	2026-01-17 11:39:28.743342-03	f	\N	f	t	\N	\N	none	1
28306	ALMACEN EMET DE FRAMBUESA		MERMELADASSSS	1240.80	1550.00	-4.000	21	/uploads/MERMELADASSSS.jpg	2026-01-12 15:56:00.974824-03	2026-01-17 11:39:28.745764-03	f	\N	f	t	\N	\N	none	1
28307	ALMACEN FLOW CEREAL FRUTOS ROJO		FLOWCEREALLLLLL	552.20	750.00	34.000	21	/uploads/FLOWCEREALLLLLL.jpg	2026-01-12 15:56:00.976906-03	2026-01-17 11:39:28.747957-03	f	\N	f	t	\N	\N	none	1
28308	ALMACEN CBSE NATANJA		CBSEEEEEEEEE	1485.00	2000.00	8.000	21	/uploads/CBSEEEEEEEEE.jpg	2026-01-12 15:56:00.979007-03	2026-01-17 11:39:28.749993-03	f	\N	f	t	\N	\N	none	1
28310	ART.LIMPIEZA HEROE DESODORANTE PISO		HEROEEEEEEE	617.10	800.00	2.000	29	\N	2026-01-12 15:56:00.98391-03	2026-01-17 11:39:28.75211-03	f	\N	f	t	\N	\N	none	1
28312	JUGUETES ASTRON AUT		JUGUETES073	7150.00	10000.00	1.000	58	/uploads/JUGUETES073.jpg	2026-01-12 15:56:00.991311-03	2026-01-17 11:39:28.757654-03	f	\N	f	t	\N	\N	none	1
28313	JUGUETES VEHICLES		JUGUETES082	1650.00	3000.00	9.000	58	/uploads/JUGUETES082.jpg	2026-01-12 15:56:00.995336-03	2026-01-17 11:39:28.759857-03	f	\N	f	t	\N	\N	none	1
28314	JUGUETES CAMION BOMBEROS		JUGUETES078	1980.00	3500.00	3.000	58	/uploads/JUGUETES078.jpg	2026-01-12 15:56:00.99984-03	2026-01-17 11:39:28.761875-03	f	\N	f	t	\N	\N	none	1
28315	ART VARIOS CINTA DE PAPEL 18 MM		CINTAAAAAAAA	1375.00	1900.00	-1.000	39	/uploads/CINTAAAAAAAA.jpg	2026-01-12 15:56:01.003863-03	2026-01-17 11:39:28.764039-03	f	\N	f	t	\N	\N	none	1
28317	FARMACIA TAFIROL DUO  + IBUPROFENO		TAFIROLDUOOOOO	407.00	600.00	-1.000	30	/uploads/TAFIROLDUOOOOO.jpg	2026-01-12 15:56:01.012128-03	2026-01-17 11:39:28.768621-03	f	\N	f	t	\N	\N	none	1
28303	BODEGA CORONA PORRON X330		CORONAAAAAA	0.00	0.00	0.000	37	/uploads/CORONAAAAAA.jpg	2026-01-12 15:56:00.96852-03	2026-01-12 15:56:00.96852-03	f	\N	f	t	\N	\N	none	1
28318	PERFUMERIA VT REPELENTE SEROSOL		OFFFFFFFFF5	2860.00	4000.00	8.000	33	/uploads/OFFFFFFFFF5.jpg	2026-01-12 15:56:01.015845-03	2026-01-17 11:39:28.771668-03	f	\N	f	t	\N	\N	none	1
28319	FARMACIA TAFIROLITO PARACETAMOL		TAFIROLLLLLLLLLLL	414.70	600.00	0.000	30	/uploads/TAFIROLLLLLLLLLLL.jpg	2026-01-12 15:56:01.019001-03	2026-01-17 11:39:28.774685-03	f	\N	f	t	\N	\N	none	1
28320	ACCESORIOS CELULARES CARGADOR  LEGATUS Y ROYALCELL		CEL003	1980.00	2900.00	-1.000	62	/uploads/CEL003.jpg	2026-01-12 15:56:01.0219-03	2026-01-17 11:39:28.77778-03	f	\N	f	t	\N	\N	none	1
28321	JUGUETES DIVER MASA		JUGUETES091	1870.00	3000.00	3.000	58	/uploads/JUGUETES091.jpg	2026-01-12 15:56:01.024911-03	2026-01-17 11:39:28.780553-03	f	\N	f	t	\N	\N	none	1
28309	FIAMBRERIA QUESO DE CERDO 214		QUESODECERDOOOOO	5036.00	27000.00	1.500	20	/uploads/QUESODECERDOOOOO.jpg	2026-01-12 15:56:00.981-03	2026-01-12 15:56:00.981-03	f	\N	f	t	\N	\N	none	1
28323	JUGUETES TINY SET BIJOU		JUGUETES086	3630.00	5500.00	2.000	58	/uploads/JUGUETES086.jpg	2026-01-12 15:56:01.031272-03	2026-01-17 11:39:28.787358-03	f	\N	f	t	\N	\N	none	1
28324	JUGUETES TINY SET MAQUILLAJE		JUGUETES089	2090.00	3500.00	1.000	58	/uploads/JUGUETES089.jpg	2026-01-12 15:56:01.034424-03	2026-01-17 11:39:28.790224-03	f	\N	f	t	\N	\N	none	1
28325	JUGUETES TINY SET MAQUILLAJE UÑAS		JUGUETES088	2090.00	3500.00	1.000	58	/uploads/JUGUETES088.jpg	2026-01-12 15:56:01.037931-03	2026-01-17 11:39:28.793213-03	f	\N	f	t	\N	\N	none	1
28326	JUGUETES TINY SET PULSERA OSITO		JUGUETE090	1540.00	3000.00	3.000	58	/uploads/JUGUETE090.jpg	2026-01-12 15:56:01.041538-03	2026-01-17 11:39:28.795973-03	f	\N	f	t	\N	\N	none	1
28328	ACCESORIOS CELULARES AURICULAR SAMSUM BOLSITA		CEL010	1540.00	2600.00	0.000	62	/uploads/CEL010.jpg	2026-01-12 15:56:01.04807-03	2026-01-17 11:39:28.800425-03	f	\N	f	t	\N	\N	none	1
28329	ACCESORIOS CELULARES AURICULAR SAMSUNG S10 GALAXY		CEL004	1870.00	3500.00	0.000	62	/uploads/CEL004.jpg	2026-01-12 15:56:01.051214-03	2026-01-17 11:39:28.802931-03	f	\N	f	t	\N	\N	none	1
28332	ACCESORIOS CELULARES CABLE CARGA RAPIDA TIPO C		CEL008	1760.00	3200.00	2.000	62	/uploads/CEL008.jpg	2026-01-12 15:56:01.065349-03	2026-01-17 11:39:28.809644-03	f	\N	f	t	\N	\N	none	1
28333	ACCESORIOS CELULARES CABLE SAMSUNG USB 3.0 TIPO C		CEL002	1760.00	3000.00	4.000	62	/uploads/CEL002.jpg	2026-01-12 15:56:01.069253-03	2026-01-17 11:39:28.811884-03	f	\N	f	t	\N	\N	none	1
28334	PERFUMERIA EFICIENT X 200		EFICIENTTTTTTT	3300.00	3500.00	5.000	33	/uploads/EFICIENTTTTTTT.jpg	2026-01-12 15:56:01.072936-03	2026-01-17 11:39:28.813947-03	f	\N	f	t	\N	\N	none	1
28335	ALMACEN DORITOS DINAMITA		DORITOSSSSSSD	2053.70	2650.00	1.000	21	/uploads/DORITOSSSSSSD.jpg	2026-01-12 15:56:01.077168-03	2026-01-17 11:39:28.81643-03	f	\N	f	t	\N	\N	none	1
28336	BAZAR RELOJ PERCHERO		BAZAR001	1650.00	4000.00	3.000	63	/uploads/BAZAR001.jpg	2026-01-12 15:56:01.080572-03	2026-01-17 11:39:28.818976-03	f	\N	f	t	\N	\N	none	1
28337	BAZAR SET DE LATA		BAZAR002	3850.00	6000.00	-1.000	63	/uploads/BAZAR002.jpg	2026-01-12 15:56:01.084763-03	2026-01-17 11:39:28.821329-03	f	\N	f	t	\N	\N	none	1
28338	ART VARIOS BARBIJO		BARBIJOSSSSSSS	275.00	350.00	10.000	39	/uploads/BARBIJOSSSSSSS.jpg	2026-01-12 15:56:01.088528-03	2026-01-17 11:39:28.82352-03	f	\N	f	t	\N	\N	none	1
28340	CIGARRILLOS RED PIOT DE 10		CIGARILLOSSSSSSSSSSSS	950.40	1400.00	3.000	51	/uploads/CIGARILLOSSSSSSSSSSSS.jpg	2026-01-12 15:56:01.093951-03	2026-01-17 11:39:28.828275-03	f	\N	f	t	\N	\N	none	1
28341	ALMACEN LECHE REMOLAC		LECHEEEEEEEEEEE	1151.70	1400.00	8.000	21	/uploads/LECHEEEEEEEEEEE.jpg	2026-01-12 15:56:01.096195-03	2026-01-17 11:39:28.830414-03	f	\N	f	t	\N	\N	none	1
28342	ALMACEN PRINGLES PAPAS FRITAS X 104 G		PAPASSSSSSS	3842.30	4600.00	18.000	21	/uploads/PAPASSSSSSS.jpg	2026-01-12 15:56:01.098246-03	2026-01-17 11:39:28.833607-03	f	\N	f	t	\N	\N	none	1
28343	CONDIMENTOS AJO TRITURADO ALICANTE		AJOOOOOO	997.70	1300.00	5.000	14	/uploads/AJOOOOOO.jpg	2026-01-12 15:56:01.100339-03	2026-01-17 11:39:28.837523-03	f	\N	f	t	\N	\N	none	1
28345	JUGUETES BOMBUCHA		BOMBUCHASSSSS	2750.00	4500.00	3.000	58	/uploads/BOMBUCHASSSSS.jpg	2026-01-12 15:56:01.104564-03	2026-01-17 11:39:28.860913-03	f	\N	f	t	\N	\N	none	1
28346	ALMACEN MAYOLIVA X 125		MATOLIVAAAA	1070.30	1400.00	17.000	21	/uploads/MATOLIVAAAA.jpg	2026-01-12 15:56:01.106596-03	2026-01-17 11:39:28.864513-03	f	\N	f	t	\N	\N	none	1
28347	GOLOSINAS TURRON DE MANI ARCOR		TURRONNNNNNN	1630.20	2000.00	0.000	18	/uploads/TURRONNNNNNN.jpg	2026-01-12 15:56:01.10999-03	2026-01-17 11:39:28.867296-03	f	\N	f	t	\N	\N	none	1
28348	GOLOSINAS GOMITAS ACIDAS X180 U		GOMOTASSSSSSSS	77.00	100.00	106.000	18	/uploads/GOMOTASSSSSSSS.jpg	2026-01-12 15:56:01.112848-03	2026-01-17 11:39:28.871865-03	f	\N	f	t	\N	\N	none	1
28349	GALLETITAS MINI PEPITO 50G		PEPITOO	772.20	1000.00	0.000	25	/uploads/PEPITOO.jpg	2026-01-12 15:56:01.115786-03	2026-01-17 11:39:28.876414-03	f	\N	f	t	\N	\N	none	1
28350	GALLETITAS MINI TODY 50G		TODYYY	561.00	750.00	1.000	25	/uploads/TODYYY.jpg	2026-01-12 15:56:01.118487-03	2026-01-17 11:39:28.881068-03	f	\N	f	t	\N	\N	none	1
28352	BIJOUTERI HEBILLAS DE PERLAS		HEBILLASSSSSSSSS	737.00	1100.00	6.000	56	/uploads/HEBILLASSSSSSSSS.jpg	2026-01-12 15:56:01.12287-03	2026-01-17 11:39:28.885748-03	f	\N	f	t	\N	\N	none	1
28353	GOLOSINAS TURRON DE MANI X 70G		TURRONNNNNNNN	660.00	1000.00	-1.000	18	/uploads/TURRONNNNNNNN.jpg	2026-01-12 15:56:01.124997-03	2026-01-17 11:39:28.889784-03	f	\N	f	t	\N	\N	none	1
28354	BAZAR BOTELLAS X 3		BOTELLAAAAAA	10450.00	17000.00	4.000	63	/uploads/BOTELLAAAAAA.jpg	2026-01-12 15:56:01.127124-03	2026-01-17 11:39:28.894297-03	f	\N	f	t	\N	\N	none	1
28356	JUGUETES PARLANTE		PARLANTEEEEEESSSS	9350.00	15000.00	-1.000	58	/uploads/PARLANTEEEEEESSSS.jpg	2026-01-12 15:56:01.131506-03	2026-01-17 11:39:28.903494-03	f	\N	f	t	\N	\N	none	1
28357	BAZAR JARRA ACERO		JARRAAAAA	14300.00	19000.00	3.000	63	/uploads/JARRAAAAA.jpg	2026-01-12 15:56:01.134066-03	2026-01-17 11:39:28.90647-03	f	\N	f	t	\N	\N	none	1
28358	BAZAR TERMO DE ACERO		TERMOOOOOOO	12650.00	20000.00	-3.000	63	/uploads/TERMOOOOOOO.jpg	2026-01-12 15:56:01.136266-03	2026-01-17 11:39:28.908683-03	f	\N	f	t	\N	\N	none	1
28359	BAZAR BOTELLA SPORT		BOTELLAAAAAAAAA	11000.00	17000.00	-1.000	63	/uploads/BOTELLAAAAAAAAA.jpg	2026-01-12 15:56:01.138362-03	2026-01-17 11:39:28.910961-03	f	\N	f	t	\N	\N	none	1
28360	BAZAR VASO CERVECERO		VASOOOOOO	14.30	22000.00	-19.000	63	/uploads/VASOOOOOO.jpg	2026-01-12 15:56:01.140414-03	2026-01-17 11:39:28.913213-03	f	\N	f	t	\N	\N	none	1
28362	JUGUETES SPAIDER-MAN		SPAIDERMAN	9350.00	14000.00	-2.000	58	/uploads/SPAIDERMAN.jpg	2026-01-12 15:56:01.145336-03	2026-01-17 11:39:28.917948-03	f	\N	f	t	\N	\N	none	1
28364	ART.LIMPIEZA ESPONJA FIBRA FACIL		ESPONJASAAAAAA	836.00	1100.00	0.000	29	/uploads/ESPONJASAAAAAA.jpg	2026-01-12 15:56:01.150153-03	2026-01-17 11:39:28.920663-03	f	\N	f	t	\N	\N	none	1
28365	ART.LIMPIEZA ESPONJA PAÑO DOBLE CARA		ESPONJAAAAAAA	2090.00	2200.00	3.000	29	/uploads/ESPONJAAAAAAA.jpg	2026-01-12 15:56:01.152198-03	2026-01-17 11:39:28.922971-03	f	\N	f	t	\N	\N	none	1
28366	GOLOSINAS ALFAJOR MARADONA		484	612.70	850.00	1.000	18	/uploads/484.jpg	2026-01-12 15:56:01.1543-03	2026-01-17 11:39:28.925323-03	f	\N	f	t	\N	\N	none	1
28368	BAZAR BOTELLA X 3		00095	9900.00	17000.00	1.000	63	/uploads/00095.jpg	2026-01-12 15:56:01.15872-03	2026-01-17 11:39:28.927853-03	f	\N	f	t	\N	\N	none	1
28369	JUGUETES PISTOLA DE AGUA		PISTOLA MEDIANA	4510.00	6300.00	-1.000	58	\N	2026-01-12 15:56:01.16104-03	2026-01-17 11:39:28.929952-03	f	\N	f	t	\N	\N	none	1
28370	GALLETITAS TOSTADAS DE ARROS MANIERI		MANIERIIIIIIIIIIIIIII	1050.50	1400.00	5.000	25	/uploads/MANIERIIIIIIIIIIIIIII.jpg	2026-01-12 15:56:01.164048-03	2026-01-17 11:39:28.932092-03	f	\N	f	t	\N	\N	none	1
28371	ALMACEN VINAGRE DE MANZANA		VINAGREEEEEEE	863.50	1150.00	3.000	21	/uploads/VINAGREEEEEEE.jpg	2026-01-12 15:56:01.166475-03	2026-01-17 11:39:28.934191-03	f	\N	f	t	\N	\N	none	1
28372	ART.LIMPIEZA SOPAPA  SIN CABO		SOPAPAAAAAAA	722.70	950.00	1.000	29	\N	2026-01-12 15:56:01.16854-03	2026-01-17 11:39:28.937118-03	f	\N	f	t	\N	\N	none	1
28373	BAZAR STANLEY. TERMO		TERMOOOOOO	18700.00	27000.00	0.000	63	/uploads/TERMOOOOOOO.jpg	2026-01-12 15:56:01.170606-03	2026-01-17 11:39:28.939926-03	f	\N	f	t	\N	\N	none	1
28375	ART VARIOS CHASQUI BOOM		CHASQUIIIIIIIII	242.00	400.00	299.000	39	/uploads/CHASQUIIIIIIIII.jpg	2026-01-12 15:56:01.174867-03	2026-01-17 11:39:28.945873-03	f	\N	f	t	\N	\N	none	1
28376	ART VARIOS CHASQUI BOMB OFERTA X 3 UNIDADES		CHASQUIIIIIIIIIIIIIIII	242.00	333.00	144.000	39	/uploads/CHASQUIIIIIIIIIIIIIIII.jpg	2026-01-12 15:56:01.176951-03	2026-01-17 11:39:28.94893-03	f	\N	f	t	\N	\N	none	1
28363	ALMACEN BIZCOCHITOS CON GRASA JORGITO X 400		0651	0.00	0.00	0.000	21	/uploads/0651.jpg	2026-01-12 15:56:01.14793-03	2026-01-12 15:56:01.14793-03	f	\N	f	t	\N	\N	none	1
28377	BODEGA BUDWEISER LATON. 710		LATONNNNNNNNN	2255.00	3000.00	0.000	37	/uploads/LATONNNNNNNNN.jpg	2026-01-12 15:56:01.17953-03	2026-01-17 11:39:28.952005-03	f	\N	f	t	\N	\N	none	1
28378	BODEGA BRAMA LATON 710		LATONNNNN	1995.40	3300.00	35.000	37	/uploads/LATONNNNN.jpg	2026-01-12 15:56:01.182311-03	2026-01-17 11:39:28.955498-03	f	\N	f	t	\N	\N	none	1
28380	BODEGA STELLA LATON 710		LATONNNNNN	3426.50	4200.00	5.000	37	/uploads/LATONNNNNN.jpg	2026-01-12 15:56:01.188727-03	2026-01-17 11:39:28.96194-03	f	\N	f	t	\N	\N	none	1
28381	ALMACEN TAKIS XPLOSION PICANTE		TAKIS	2222.00	2800.00	15.000	21	/uploads/TAKIS.jpg	2026-01-12 15:56:01.192545-03	2026-01-17 11:39:28.965748-03	f	\N	f	t	\N	\N	none	1
28382	LACTEOS YOGUR CON FRUTA REMOLAC		TEMOLACCCCCCC	566.50	750.00	-2.000	26	/uploads/TEMOLACCCCCCC.jpg	2026-01-12 15:56:01.19598-03	2026-01-17 11:39:28.968176-03	f	\N	f	t	\N	\N	none	1
28383	BODEGA CIRCUS MALBEC		CIRCUSSSSSS	2462.90	3250.00	0.000	37	\N	2026-01-12 15:56:01.19883-03	2026-01-17 11:39:28.970425-03	f	\N	f	t	\N	\N	none	1
28384	GALLETITAS TOSTADITAS TOSTI		TOSTADITASSSSSS	799.70	1000.00	1.000	25	/uploads/TOSTADITASSSSSS.jpg	2026-01-12 15:56:01.202466-03	2026-01-17 11:39:28.972574-03	f	\N	f	t	\N	\N	none	1
28385	ART VARIOS TERMON STANLEY		TERMOOOOOOP	22.00	27.00	0.000	39	\N	2026-01-12 15:56:01.205964-03	2026-01-17 11:39:28.975265-03	f	\N	f	t	\N	\N	none	1
28386	LACTEOS FLA LA SERENISIMA		FLANNNNNNMMM	1523.50	1800.00	4.000	26	\N	2026-01-12 15:56:01.209469-03	2026-01-17 11:39:28.977723-03	f	\N	f	t	\N	\N	none	1
28388	BODEGA PEÑON DE AGUILA		CERBEZAAA	1323.30	1800.00	4.000	37	/uploads/CERBEZAAA.jpg	2026-01-12 15:56:01.217194-03	2026-01-17 11:39:28.982018-03	f	\N	f	t	\N	\N	none	1
28390	BODEGA LIT RUBIA LAGER		CERBEZA	1046.10	1400.00	10.000	37	/uploads/CERBEZA.jpg	2026-01-12 15:56:01.223892-03	2026-01-17 11:39:28.986581-03	f	\N	f	t	\N	\N	none	1
28391	LIBRERIA SACA PUNTA SIMBALL		SACAPUNTASSSSS	330.00	500.00	17.000	59	/uploads/SACAPUNTASSSSS.jpg	2026-01-12 15:56:01.226152-03	2026-01-17 11:39:28.988881-03	f	\N	f	t	\N	\N	none	1
28392	LIBRERIA SACA PUNTA COMUN		SACAPUNTASS	88.00	300.00	44.000	59	/uploads/SACAPUNTASS.jpg	2026-01-12 15:56:01.228405-03	2026-01-17 11:39:28.991544-03	f	\N	f	t	\N	\N	none	1
28394	LIBRERIA 10 MARCADORES ESCO		FIBRASSSSS	935.00	1200.00	-7.000	59	/uploads/FIBRASSSSS.jpg	2026-01-12 15:56:01.233162-03	2026-01-17 11:39:28.996675-03	f	\N	f	t	\N	\N	none	1
28395	LIBRERIA 12 MARCADORES ARTE&COR		FIBRASSSS	660.00	900.00	0.000	59	/uploads/FIBRASSSS.jpg	2026-01-12 15:56:01.236601-03	2026-01-17 11:39:28.998839-03	f	\N	f	t	\N	\N	none	1
28396	LIBRERIA 10 MULTICOLOURED		VIROMESSSSSS	1540.00	2000.00	-1.000	59	/uploads/VIROMESSSSSS.jpg	2026-01-12 15:56:01.238915-03	2026-01-17 11:39:29.000935-03	f	\N	f	t	\N	\N	none	1
28397	LIBRERIA GANCHOS DE COLORES		GANCHOSSSS	154.00	500.00	49.000	59	/uploads/GANCHOSSSS.jpg	2026-01-12 15:56:01.241138-03	2026-01-17 11:39:29.002985-03	f	\N	f	t	\N	\N	none	1
28398	LIBRERIA BIC		VIROMESSSSS	330.00	500.00	-34.000	59	/uploads/VIROMESSSSS.jpg	2026-01-12 15:56:01.243283-03	2026-01-17 11:39:29.005151-03	f	\N	f	t	\N	\N	none	1
28432	FRESCOS YOGUR REMOLAC CON CEREALES		YOGURRRRRT	656.00	3037.50	0.000	42	\N	2026-01-12 15:56:01.34009-03	2026-01-12 15:56:01.34009-03	f	\N	f	t	\N	\N	none	1
28400	LIBRERIA LAPIZ NEGRO EZCO		LAPIZZZZ	110.00	300.00	17.000	59	/uploads/LAPIZZZZ.jpg	2026-01-12 15:56:01.247488-03	2026-01-17 11:39:29.010141-03	f	\N	f	t	\N	\N	none	1
28401	LIBRERIA MARCADORES PARA PIZARRAS		MARCADORESSSSS	660.00	900.00	-5.000	59	/uploads/MARCADORESSSSS.jpg	2026-01-12 15:56:01.249576-03	2026-01-17 11:39:29.012352-03	f	\N	f	t	\N	\N	none	1
28402	LIBRERIA MARCADORES PERMANENTES		MARCADORESSSSSSS	550.00	800.00	-39.000	59	/uploads/MARCADORESSSSSSS.jpg	2026-01-12 15:56:01.251563-03	2026-01-17 11:39:29.014598-03	f	\N	f	t	\N	\N	none	1
28403	LIBRERIA BOLIGRAFO EZCO		BIROMEEE	132.00	300.00	36.000	59	/uploads/BIROMEEE.jpg	2026-01-12 15:56:01.253595-03	2026-01-17 11:39:29.016968-03	f	\N	f	t	\N	\N	none	1
28405	LIBRERIA BIC BIROME		BIROMEEEEEE	550.00	800.00	34.000	59	/uploads/BIROMEEEEEE.jpg	2026-01-12 15:56:01.258269-03	2026-01-17 11:39:29.022842-03	f	\N	f	t	\N	\N	none	1
28406	LIBRERIA TIJERITAS MAPED		TIJERITASSSSS	1045.00	1500.00	2.000	59	/uploads/TIJERITASSSSS.jpg	2026-01-12 15:56:01.260782-03	2026-01-17 11:39:29.025421-03	f	\N	f	t	\N	\N	none	1
28407	LIBRERIA CINTA DE PAPEL		CINTAAAAAA	1650.00	2100.00	-2.000	59	/uploads/CINTAAAAAA.jpg	2026-01-12 15:56:01.263085-03	2026-01-17 11:39:29.027877-03	f	\N	f	t	\N	\N	none	1
28408	LIBRERIA GOMAS SIMBAL		GOMASSSS	231.00	400.00	35.000	59	/uploads/GOMASSSS.jpg	2026-01-12 15:56:01.265173-03	2026-01-17 11:39:29.030318-03	f	\N	f	t	\N	\N	none	1
28409	LIBRERIA GOMA EZCOO		GOMASSSSSSSS	234.30	500.00	27.000	59	/uploads/GOMASSSSSSSS.jpg	2026-01-12 15:56:01.267277-03	2026-01-17 11:39:29.032408-03	f	\N	f	t	\N	\N	none	1
28411	LIBRERIA COLORES MAPED LARGOS		COLORESSS	1540.00	2500.00	-1.000	59	/uploads/COLORESSS.jpg	2026-01-12 15:56:01.271824-03	2026-01-17 11:39:29.037159-03	f	\N	f	t	\N	\N	none	1
28412	LIBRERIA MARCADORES EZCO TRIANGULARES X12		MARCADORESSSS	3190.00	5000.00	-3.000	59	/uploads/MARCADORESSSS.jpg	2026-01-12 15:56:01.274026-03	2026-01-17 11:39:29.03931-03	f	\N	f	t	\N	\N	none	1
28413	LIBRERIA MARCADORES EZCO X24		MARCADORESSSD	5500.00	7000.00	1.000	59	/uploads/MARCADORESSSD.jpg	2026-01-12 15:56:01.276098-03	2026-01-17 11:39:29.04136-03	f	\N	f	t	\N	\N	none	1
28415	LIBRERIA HOJAS CANZON CAPITOLIO N°3 BLANCA		HOJASSSSSSSS	440.00	700.00	8.000	59	/uploads/HOJASSSSSSSS.jpg	2026-01-12 15:56:01.280187-03	2026-01-17 11:39:29.045669-03	f	\N	f	t	\N	\N	none	1
28416	LIBRERIA CARPETA PLASTICA N° 3		CARPETASSSS	1100.00	1500.00	-1.000	59	/uploads/CARPETASSSS.jpg	2026-01-12 15:56:01.282468-03	2026-01-17 11:39:29.048028-03	f	\N	f	t	\N	\N	none	1
28417	LIBRERIA CUADERNO EXITO N°1 TAPA DURA 48 HOJAS		CUADERNOSSS	4290.00	5500.00	0.000	59	/uploads/CUADERNOSSS.jpg	2026-01-12 15:56:01.285395-03	2026-01-17 11:39:29.050038-03	f	\N	f	t	\N	\N	none	1
28418	LIBRERIA CUADERNO EXITO N°3 TAPA DURA		CUADERNOOOO	5390.00	7500.00	8.000	59	/uploads/CUADERNOOOO.jpg	2026-01-12 15:56:01.289331-03	2026-01-17 11:39:29.052345-03	f	\N	f	t	\N	\N	none	1
28420	LIBRERIA HOJAS LAPRIDA RAYADAS X96		HOJASSSSSSSD	2750.00	3800.00	-10.000	59	/uploads/HOJASSSSSSSD.jpg	2026-01-12 15:56:01.298237-03	2026-01-17 11:39:29.058504-03	f	\N	f	t	\N	\N	none	1
28421	ALMACEN DULCE DE MEMBRILLO,BATATA EMET		DULCEEEEEE	1243.00	1600.00	0.000	21	/uploads/DULCEEEEEE.jpg	2026-01-12 15:56:01.302465-03	2026-01-17 11:39:29.061531-03	f	\N	f	t	\N	\N	none	1
28422	GOLOSINAS GOMITAS ACIDAS MOGULL X72 UNIDADES		MOGULLLLLL	111.10	150.00	-35.000	18	/uploads/MOGULLLLLL.jpg	2026-01-12 15:56:01.30619-03	2026-01-17 11:39:29.063889-03	f	\N	f	t	\N	\N	none	1
28423	ALMACEN ALCAPARRAS CUMANA		ALCAPARRASSSSS	1941.50	2400.00	3.000	21	/uploads/ALCAPARRASSSSS.jpg	2026-01-12 15:56:01.310229-03	2026-01-17 11:39:29.066366-03	f	\N	f	t	\N	\N	none	1
28424	ALMACEN CHORI		CHORISOOOO	7590.00	7900.00	0.500	21	\N	2026-01-12 15:56:01.313276-03	2026-01-17 11:39:29.069124-03	f	\N	f	t	\N	\N	none	1
28425	LIBRERIA UNIVERCITARIOS		CUADERNOSSDD	2035.00	3500.00	-11.000	59	/uploads/CUADERNOSSDD.jpg	2026-01-12 15:56:01.31658-03	2026-01-17 11:39:29.072333-03	f	\N	f	t	\N	\N	none	1
28426	LIBRERIA CARPETA N° 5		CARPETASSSSSS	1540.00	2200.00	-2.000	59	/uploads/CARPETASSSSSS.jpg	2026-01-12 15:56:01.319493-03	2026-01-17 11:39:29.075683-03	f	\N	f	t	\N	\N	none	1
28428	LIBRERIA CARPETAS N°3 TAPA DURA		CARPETASSSSS	2420.00	3000.00	3.000	59	/uploads/CARPETASSSSS.jpg	2026-01-12 15:56:01.326236-03	2026-01-17 11:39:29.083784-03	f	\N	f	t	\N	\N	none	1
28429	LIBRERIA CUADERNOS TAPA BLANDA		CUADERNOSSSD	1100.00	1500.00	-3.000	59	/uploads/CUADERNOSSSD.jpg	2026-01-12 15:56:01.330256-03	2026-01-17 11:39:29.087615-03	f	\N	f	t	\N	\N	none	1
28430	LIBRERIA CARTULINA DE COLOR POR UNIDAD		CARTULINASS	275.00	400.00	-30.000	59	/uploads/CARTULINASS.jpg	2026-01-12 15:56:01.333766-03	2026-01-17 11:39:29.089948-03	f	\N	f	t	\N	\N	none	1
28431	LIBRERIA PLASTICOLA X50		PLASTICOLAAAS	660.00	800.00	-8.000	59	/uploads/PLASTICOLAAAS.jpg	2026-01-12 15:56:01.336938-03	2026-01-17 11:39:29.092031-03	f	\N	f	t	\N	\N	none	1
28433	GOLOSINAS FERRERO ROCHER		FERREROOOOOOOO	757.90	1200.00	-9.000	18	/uploads/FERREROOOOOOOO.jpg	2026-01-12 15:56:01.343249-03	2026-01-17 11:39:29.095399-03	f	\N	f	t	\N	\N	none	1
28435	LIBRERIA CARTUCHERA TUBO GRANDE		CARTUCHERAAAA	2750.00	5000.00	11.000	59	/uploads/CARTUCHERAAAA.jpg	2026-01-12 15:56:01.3492-03	2026-01-17 11:39:29.10141-03	f	\N	f	t	\N	\N	none	1
28436	LIBRERIA CARTUCHERA COSMETICA		CARTUCHERAAAAAA	2750.00	6000.00	3.000	59	/uploads/CARTUCHERAAAAAA.jpg	2026-01-12 15:56:01.353696-03	2026-01-17 11:39:29.104741-03	f	\N	f	t	\N	\N	none	1
28437	LIBRERIA MOCHILA FILGO		MOCHILAAAAAA	14300.00	20000.00	0.000	59	/uploads/MOCHILAAAAAA.jpg	2026-01-12 15:56:01.358156-03	2026-01-17 11:39:29.108132-03	f	\N	f	t	\N	\N	none	1
28438	LIBRERIA MOCHILA INFLUENCER		MOCHILAAAAAAAA	10450.00	16000.00	1.000	59	/uploads/MOCHILAAAAAAAA.jpg	2026-01-12 15:56:01.361163-03	2026-01-17 11:39:29.111164-03	f	\N	f	t	\N	\N	none	1
28440	LIBRERIA MARCADORES FILGO PINTO		MARCADORES FILGO	935.00	1400.00	7.000	59	/uploads/MARCADORES FILGO.jpg	2026-01-12 15:56:01.367897-03	2026-01-17 11:39:29.116134-03	f	\N	f	t	\N	\N	none	1
28441	LIBRERIA ETIQUETAS		ETIQUETASSSS	132.00	300.00	55.000	59	/uploads/ETIQUETASSSS.jpg	2026-01-12 15:56:01.370862-03	2026-01-17 11:39:29.119706-03	f	\N	f	t	\N	\N	none	1
28442	LIBRERIA LAPICERA 10 COLORES		LAPICERAAAA	1430.00	2000.00	7.000	59	/uploads/LAPICERAAAA.jpg	2026-01-12 15:56:01.374057-03	2026-01-17 11:39:29.124042-03	f	\N	f	t	\N	\N	none	1
28443	LIBRERIA PEGASTIK ADHESIVO		PEGASTIKKK	330.00	600.00	-14.000	59	/uploads/PEGASTIKKK.jpg	2026-01-12 15:56:01.377563-03	2026-01-17 11:39:29.128343-03	f	\N	f	t	\N	\N	none	1
28445	LIBRERIA BIC EBOLUTION  + R GRATIS		LAPIZZZZZZZ	2750.00	3000.00	0.000	59	/uploads/LAPIZZZZZZZ.jpg	2026-01-12 15:56:01.383021-03	2026-01-17 11:39:29.136874-03	f	\N	f	t	\N	\N	none	1
28446	UNIDAD LUZ DE EMERGENCIA		LUZZZZZ	16500.00	20000.00	2.000	52	/uploads/LUZZZZZ.jpg	2026-01-12 15:56:01.386027-03	2026-01-17 11:39:29.141412-03	f	\N	f	t	\N	\N	none	1
28448	ART VARIOS COLITAS SET		COLITASSSSSD	935.00	1500.00	5.000	39	/uploads/COLITASSSSSD.jpg	2026-01-12 15:56:01.390478-03	2026-01-17 11:39:29.150093-03	f	\N	f	t	\N	\N	none	1
28504	ALMACEN HUEVO CHATO DE PASCUA		HUEVOOOOOOOOOOO	1980.00	2500.00	1.000	21	/uploads/HUEVOOOOOOOOOOO.jpg	2026-01-12 15:56:01.603114-03	2026-01-17 11:39:29.310559-03	f	\N	f	t	\N	\N	none	1
28450	CIGARRILLOS LUCKY STRIKE		LUCKYYYYYY	3476.00	3650.00	8.000	51	/uploads/LUCKYYYYYY.jpg	2026-01-12 15:56:01.395225-03	2026-01-17 11:39:29.159069-03	f	\N	f	t	\N	\N	none	1
28451	LIBRERIA SIMBALL GOMA		GOMAAA	225.50	400.00	30.000	59	/uploads/GOMAAA.jpg	2026-01-12 15:56:01.429597-03	2026-01-17 11:39:29.163657-03	f	\N	f	t	\N	\N	none	1
28452	LIBRERIA EZCO GOMA		GOMAAAA	234.30	500.00	-26.000	59	/uploads/GOMAAAA.jpg	2026-01-12 15:56:01.432851-03	2026-01-17 11:39:29.168966-03	f	\N	f	t	\N	\N	none	1
28453	LIBRERIA LUMA PAPEL LUSTRE		PAPELL	154.00	400.00	48.000	59	/uploads/PAPELL.jpg	2026-01-12 15:56:01.436569-03	2026-01-17 11:39:29.173203-03	f	\N	f	t	\N	\N	none	1
28454	LIBRERIA LUMA METALIZADO		PAPEL	231.00	800.00	45.000	59	/uploads/PAPEL.jpg	2026-01-12 15:56:01.440367-03	2026-01-17 11:39:29.176651-03	f	\N	f	t	\N	\N	none	1
28455	LIBRERIA LUMA FLUO		PAPELLL	297.00	500.00	8.000	59	/uploads/PAPELLL.jpg	2026-01-12 15:56:01.444668-03	2026-01-17 11:39:29.180005-03	f	\N	f	t	\N	\N	none	1
28458	ALMACEN CARBON X10K		CARBONNNNNN	4510.00	6000.00	0.000	21	\N	2026-01-12 15:56:01.45263-03	2026-01-17 11:39:29.186548-03	f	\N	f	t	\N	\N	none	1
28459	UNIDAD CINTA ANCHA		CINTAA	2200.00	2500.00	-2.000	52	/uploads/CINTAA.jpg	2026-01-12 15:56:01.455352-03	2026-01-17 11:39:29.18943-03	f	\N	f	t	\N	\N	none	1
28460	CIGARRILLOS MASTER DE 20		MASTERRRRRRR	1540.00	1850.00	-21.000	51	/uploads/MASTERRRRRRR.jpg	2026-01-12 15:56:01.458151-03	2026-01-17 11:39:29.193524-03	f	\N	f	t	\N	\N	none	1
28461	LIBRERIA CARPETA		CAROETASSS	1100.00	5000.00	3.000	59	/uploads/CAROETASSS.jpg	2026-01-12 15:56:01.461085-03	2026-01-17 11:39:29.19684-03	f	\N	f	t	\N	\N	none	1
28463	LIBRERIA LAPICERAS FILGO BORRABLES		LAPICERASSS	6.27	1800.00	12.000	59	/uploads/LAPICERASSS.jpg	2026-01-12 15:56:01.466247-03	2026-01-17 11:39:29.202131-03	f	\N	f	t	\N	\N	none	1
28464	LIBRERIA CARTUCHERAS		CARTUSSS	1430.00	2500.00	6.000	59	/uploads/CARTUSSS.jpg	2026-01-12 15:56:01.468789-03	2026-01-17 11:39:29.205684-03	f	\N	f	t	\N	\N	none	1
28465	LIBRERIA SEÑALADOR		NEO ART	550.00	800.00	0.000	59	/uploads/NEO ART.jpg	2026-01-12 15:56:01.471368-03	2026-01-17 11:39:29.209084-03	f	\N	f	t	\N	\N	none	1
28466	LIBRERIA REGLA FIRME		REGLAAA	385.00	600.00	6.000	59	/uploads/REGLAAA.jpg	2026-01-12 15:56:01.47387-03	2026-01-17 11:39:29.212244-03	f	\N	f	t	\N	\N	none	1
28467	LIBRERIA AICHES		AFICHESS	550.00	800.00	-8.000	59	/uploads/AFICHESS.jpg	2026-01-12 15:56:01.476254-03	2026-01-17 11:39:29.214404-03	f	\N	f	t	\N	\N	none	1
28469	LIBRERIA SEPARADORES		SEPARADORESS	1100.00	2000.00	12.000	59	/uploads/SEPARADORESS.jpg	2026-01-12 15:56:01.480891-03	2026-01-17 11:39:29.219063-03	f	\N	f	t	\N	\N	none	1
28470	LIBRERIA SEPARADORESSS		SEPARADORESSSS	1100.00	2000.00	1.000	59	/uploads/SEPARADORESSSS.jpg	2026-01-12 15:56:01.484506-03	2026-01-17 11:39:29.221221-03	f	\N	f	t	\N	\N	none	1
28457	BEBIDA HEINEKEN		CERBEZAA	3392.00	15187.50	1.000	19	/uploads/CERBEZAA.jpg	2026-01-12 15:56:01.450223-03	2026-01-12 15:56:01.450223-03	f	\N	f	t	\N	\N	none	1
28471	LIBRERIA FOLIO LIGGO		FOLIO	550.00	1000.00	2.000	59	/uploads/FOLIO.jpg	2026-01-12 15:56:01.486872-03	2026-01-17 11:39:29.223403-03	f	\N	f	t	\N	\N	none	1
28472	LIBRERIA FLIO LUMA		FLIOSS	660.00	2000.00	4.000	59	/uploads/FLIOSS.jpg	2026-01-12 15:56:01.489732-03	2026-01-17 11:39:29.226516-03	f	\N	f	t	\N	\N	none	1
28473	LIBRERIA FOLIOS		FLIIOS	660.00	1000.00	3.000	59	/uploads/FLIIOS.jpg	2026-01-12 15:56:01.4923-03	2026-01-17 11:39:29.229624-03	f	\N	f	t	\N	\N	none	1
28475	LIBRERIA NEOART		NEOART	7700.00	15000.00	1.000	59	/uploads/NEOART.jpg	2026-01-12 15:56:01.496878-03	2026-01-17 11:39:29.235524-03	f	\N	f	t	\N	\N	none	1
28476	LIBRERIA AROS METALICOS EZCO		AROS	110.00	250.00	39.000	59	/uploads/AROS.jpg	2026-01-12 15:56:01.499659-03	2026-01-17 11:39:29.237927-03	f	\N	f	t	\N	\N	none	1
28477	LIBRERIA CORRECTOR INTRE		CORRECTOR	275.00	800.00	13.000	59	/uploads/CORRECTOR.jpg	2026-01-12 15:56:01.502388-03	2026-01-17 11:39:29.240409-03	f	\N	f	t	\N	\N	none	1
28478	LIBRERIA BIROME YANGHAO		BIROME	366.30	1200.00	12.000	59	/uploads/BIROME.jpg	2026-01-12 15:56:01.505965-03	2026-01-17 11:39:29.242564-03	f	\N	f	t	\N	\N	none	1
28479	UNIDAD TORTA FRITA		TORTAFRITA	440.00	550.00	-65.000	52	/uploads/TORTAFRITA.jpg	2026-01-12 15:56:01.509244-03	2026-01-17 11:39:29.245032-03	f	\N	f	t	\N	\N	none	1
28481	LIBRERIA LAPIZ NEGRO GRAFITO		LAPIZZZZZZ	165.00	200.00	-4.000	59	/uploads/LAPIZZZZZZ.jpg	2026-01-12 15:56:01.517144-03	2026-01-17 11:39:29.249365-03	f	\N	f	t	\N	\N	none	1
28482	AGUA AGUA DE 600 BENEDICTO		AGUAAAAAAAAA	733.70	900.00	4.000	23	/uploads/AGUAAAAAAAAA.jpg	2026-01-12 15:56:01.520638-03	2026-01-17 11:39:29.251608-03	f	\N	f	t	\N	\N	none	1
28483	ALMACEN CHEDAR TAU		CHEDARRRR	1943.70	2500.00	1.000	21	/uploads/CHEDARRRR.jpg	2026-01-12 15:56:01.523512-03	2026-01-17 11:39:29.254394-03	f	\N	f	t	\N	\N	none	1
28484	ALMACEN LAUREL		LAURELLLL	275.00	350.00	5.000	21	/uploads/LAURELLLL.jpg	2026-01-12 15:56:01.527369-03	2026-01-17 11:39:29.257715-03	f	\N	f	t	\N	\N	none	1
28486	LIBRERIA AGENDA		AGENDAAAAAA	6600.00	8000.00	-1.000	59	/uploads/AGENDAAAAAA.jpg	2026-01-12 15:56:01.533359-03	2026-01-17 11:39:29.262934-03	f	\N	f	t	\N	\N	none	1
28487	ALMACEN AVENA CUMANA		AVENAAAAAA	1856.80	2400.00	5.000	21	/uploads/AVENAAAAAA.jpg	2026-01-12 15:56:01.536876-03	2026-01-17 11:39:29.265354-03	f	\N	f	t	\N	\N	none	1
28488	ALMACEN HUEVO DE PASCUA GRANDE		HUEVOOOOO	3080.00	3800.00	1.000	21	/uploads/HUEVOOOOO.jpg	2026-01-12 15:56:01.539874-03	2026-01-17 11:39:29.267791-03	f	\N	f	t	\N	\N	none	1
28489	ALMACEN HUEVO CHIQUITO		HUEVOOOOOO	1210.00	1500.00	1.000	21	/uploads/HUEVOOOOOO.jpg	2026-01-12 15:56:01.543523-03	2026-01-17 11:39:29.270296-03	f	\N	f	t	\N	\N	none	1
28491	LIBRERIA HOJAS CANSON NRO 5		HOJAS NRO 5	605.00	1000.00	22.000	59	/uploads/HOJAS NRO 5.jpg	2026-01-12 15:56:01.549218-03	2026-01-17 11:39:29.27498-03	f	\N	f	t	\N	\N	none	1
28492	LIBRERIA BLOK DE HOJAS TIPO EL NENE		BLOKKKK	1980.00	3000.00	2.000	59	/uploads/BLOKKKK.jpg	2026-01-12 15:56:01.553068-03	2026-01-17 11:39:29.278024-03	f	\N	f	t	\N	\N	none	1
28493	JUGUETES POPIS		POPISSSSS	5500.00	10000.00	2.000	58	/uploads/POPISSSSS.jpg	2026-01-12 15:56:01.557028-03	2026-01-17 11:39:29.281056-03	f	\N	f	t	\N	\N	none	1
28494	BAZAR VASO TERMICO COFFEE		VASOOO	9900.00	13000.00	2.000	63	/uploads/VASOOO.jpg	2026-01-12 15:56:01.561295-03	2026-01-17 11:39:29.283866-03	f	\N	f	t	\N	\N	none	1
28495	BAZAR BOTELLA STANLEY		BOTELLAAA	13750.00	18000.00	0.000	63	/uploads/BOTELLAAA.jpg	2026-01-12 15:56:01.565071-03	2026-01-17 11:39:29.286694-03	f	\N	f	t	\N	\N	none	1
28497	ALMACEN SALDIX		SALADIXXXXXX	1025.20	1300.00	1.000	21	/uploads/SALADIXXXXXX.jpg	2026-01-12 15:56:01.573334-03	2026-01-17 11:39:29.29102-03	f	\N	f	t	\N	\N	none	1
28498	ALMACEN HAMBURGUESAS KANDY		HAMBURGUESASS	1664.30	2200.00	-2.000	21	/uploads/HAMBURGUESASS.jpg	2026-01-12 15:56:01.577601-03	2026-01-17 11:39:29.293026-03	f	\N	f	t	\N	\N	none	1
28499	ALMACEN MIEL LA COLMENA X 500G		MIELLLLLLLLLLLL	2200.00	2700.00	0.000	21	/uploads/MIELLLLLLLLLLLL.jpg	2026-01-12 15:56:01.581683-03	2026-01-17 11:39:29.295379-03	f	\N	f	t	\N	\N	none	1
28500	VERDULERIA PAPA LAVADA		PAPAAAAAAA	0.00	0.00	-3.010	27	\N	2026-01-12 15:56:01.585747-03	2026-01-17 11:39:29.297695-03	f	\N	f	t	\N	\N	none	1
28501	GALLETITAS GAONA CON CHIP DE CHOCOLATE		GAONAAAAAA	1131.90	1500.00	-4.000	25	/uploads/GAONAAAAAA.jpg	2026-01-12 15:56:01.590558-03	2026-01-17 11:39:29.299837-03	f	\N	f	t	\N	\N	none	1
28503	ALMACEN COCA RETORNABLE	\N	COCAAAAAAAA	2123.00	2900.00	-9.000	21	/uploads/COCAAAAAAAA.jpg	2026-01-12 15:56:01.599265-03	2026-01-17 11:39:29.307194-03	f	\N	f	t	\N	\N	none	1
28505	ALMACEN HUEVO PASCUA		HUEVOOOOOOOOI	2750.00	3000.00	0.000	21	/uploads/HUEVOOOOOOOOI.jpg	2026-01-12 15:56:01.607022-03	2026-01-17 11:39:29.313299-03	f	\N	f	t	\N	\N	none	1
28506	GOLOSINAS JIRA CHICLE		JIRACHICLEEEEEE	220.00	300.00	-28.000	18	/uploads/JIRACHICLEEEEEE.jpg	2026-01-12 15:56:01.610798-03	2026-01-17 11:39:29.316014-03	f	\N	f	t	\N	\N	none	1
28508	GOLOSINAS LATITAS CHICLES		LATITASSSSSSS	440.00	700.00	12.000	18	/uploads/LATITASSSSSSS.jpg	2026-01-12 15:56:01.617718-03	2026-01-17 11:39:29.320491-03	f	\N	f	t	\N	\N	none	1
28528	BEBIDA BAGIO MINI X 125		BAGIOOOOOO	214.00	1181.25	34.000	19	\N	2026-01-12 15:56:01.689297-03	2026-01-12 15:56:01.689297-03	f	\N	f	t	\N	\N	none	1
28509	PERFUMERIA DONCELLA TOALLITAS		TOALLITASSSSSSS	500.00	2700.00	23.000	33	/uploads/TOALLITASSSSSSS.jpg	2026-01-12 15:56:01.620799-03	2026-01-12 15:56:01.620799-03	f	\N	f	t	\N	\N	none	1
28511	PERFUMERIA CLOSEUP DIENTES FUERTES		DENTRIFCOOO	880.00	1800.00	43.000	33	/uploads/DENTRIFCOOO.jpg	2026-01-12 15:56:01.62638-03	2026-01-17 11:39:29.324981-03	f	\N	f	t	\N	\N	none	1
28512	BODEGA VASCO VIEJO		VINOOOOOO	2046.00	2800.00	0.000	37	/uploads/VINOOOOOO.jpg	2026-01-12 15:56:01.629585-03	2026-01-17 11:39:29.32756-03	f	\N	f	t	\N	\N	none	1
28513	UNIDAD CHIP PERSONAL MOVISTAR TUENTI		CHIPSSS	88.00	500.00	140.000	52	/uploads/CHIPSSS.jpg	2026-01-12 15:56:01.632518-03	2026-01-17 11:39:29.330634-03	f	\N	f	t	\N	\N	none	1
28514	GOLOSINAS LOLLIPOP MALBABISCO		MALBABISCOSSSSS	312.40	400.00	-13.000	18	/uploads/MALBABISCOSSSSS.jpg	2026-01-12 15:56:01.636097-03	2026-01-17 11:39:29.333706-03	f	\N	f	t	\N	\N	none	1
28515	GOLOSINAS MARIPOSA GELATINAS		GELATINASSS	293.70	400.00	5.000	\N	/uploads/GELATINASSS.jpg	2026-01-12 15:56:01.639812-03	2026-01-17 11:39:29.337247-03	f	\N	f	t	\N	\N	none	1
28516	ALMACEN PAN DE PANCHO FARGOOOO		PANNNNNNNNNNNM	1310.10	1600.00	-1.000	21	\N	2026-01-12 15:56:01.643777-03	2026-01-17 11:39:29.339651-03	f	\N	f	t	\N	\N	none	1
28518	BODEGA BETA IPA		BETAAAAAAAAA	1826.00	2250.00	-1.000	37	/uploads/BETAAAAAAAAA.jpg	2026-01-12 15:56:01.65182-03	2026-01-17 11:39:29.344002-03	f	\N	f	t	\N	\N	none	1
28519	PERFUMERIA ESMALTE PERLADOS		ESMALTEEEE	2530.00	3500.00	0.000	33	/uploads/ESMALTEEEE.jpg	2026-01-12 15:56:01.655794-03	2026-01-17 11:39:29.346347-03	f	\N	f	t	\N	\N	none	1
28520	PERFUMERIA ESMALTES TRATAMIENTOS		ESMALTE TRATAMIENTOSSSS	1936.00	2200.00	4.000	33	/uploads/ESMALTE TRATAMIENTOSSSS.jpg	2026-01-12 15:56:01.659846-03	2026-01-17 11:39:29.348579-03	f	\N	f	t	\N	\N	none	1
28521	PERFUMERIA ESMALTE GEL		ESMALTEEE GELL	2816.00	3200.00	6.000	33	/uploads/ESMALTEEE GELL.jpg	2026-01-12 15:56:01.663812-03	2026-01-17 11:39:29.350666-03	f	\N	f	t	\N	\N	none	1
28522	PERFUMERIA TOP COA		TOP COAA	3520.00	4000.00	1.000	33	/uploads/TOP COAA.jpg	2026-01-12 15:56:01.667831-03	2026-01-17 11:39:29.353262-03	f	\N	f	t	\N	\N	none	1
28523	ART VARIOS VELAS NUMEROS		VELASSSSSS	590.70	1000.00	-6.000	39	/uploads/VELASSSSSS.jpg	2026-01-12 15:56:01.671419-03	2026-01-17 11:39:29.356589-03	f	\N	f	t	\N	\N	none	1
28524	ART VARIOS PAPEL DE REGALO		PAPELLLLLLLLL	429.00	700.00	17.000	39	/uploads/PAPELLLLLLLLL.jpg	2026-01-12 15:56:01.67527-03	2026-01-17 11:39:29.359833-03	f	\N	f	t	\N	\N	none	1
28525	ALMACEN AZAFRAN		AZAFRANNNNNN	2124.10	2600.00	4.000	21	/uploads/AZAFRANNNNNN.jpg	2026-01-12 15:56:01.679088-03	2026-01-17 11:39:29.362821-03	f	\N	f	t	\N	\N	none	1
28526	ART VARIOS VELAS CON BRILLO		VELASSSSS	308.00	700.00	49.000	39	/uploads/VELASSSSS.jpg	2026-01-12 15:56:01.682985-03	2026-01-17 11:39:29.366536-03	f	\N	f	t	\N	\N	none	1
28529	ART VARIOS PILAS CHINAS		PILASSSSSS	156.20	350.00	61.000	39	/uploads/PILASSSSSS.jpg	2026-01-12 15:56:01.693532-03	2026-01-17 11:39:29.370482-03	f	\N	f	t	\N	\N	none	1
28527	FARMACIA TE NEXT		TENEXXXXX	0.00	0.00	0.000	30	/uploads/TENEXXXXX.jpg	2026-01-12 15:56:01.686058-03	2026-01-12 15:56:01.686058-03	f	\N	f	t	\N	\N	none	1
28530	LIBRERIA CINTA CORRECTORA EZCO		CORRECTORRRRRR	770.00	1500.00	5.000	59	/uploads/CORRECTORRRRRR.jpg	2026-01-12 15:56:01.697522-03	2026-01-17 11:39:29.375205-03	f	\N	f	t	\N	\N	none	1
28531	JUGUETES AUTO RACING CAR CONTROL REMOTO		AUTOSSSSS	7370.00	12500.00	3.000	58	/uploads/AUTOSSSSS.jpg	2026-01-12 15:56:01.701041-03	2026-01-17 11:39:29.379728-03	f	\N	f	t	\N	\N	none	1
28532	JUGUETES PELOTA TROMPO		TROMPOOOO	3300.00	5000.00	3.000	58	/uploads/TROMPOOOO.jpg	2026-01-12 15:56:01.704258-03	2026-01-17 11:39:29.384594-03	f	\N	f	t	\N	\N	none	1
28533	JUGUETES ESCOPETA SHOOT GUN		ESCOPETAAAA	6600.00	12500.00	2.000	58	/uploads/ESCOPETAAAA.jpg	2026-01-12 15:56:01.708469-03	2026-01-17 11:39:29.393735-03	f	\N	f	t	\N	\N	none	1
28534	JUGUETES SLIME DUO		SLIMEEEE	1980.00	3500.00	1.000	58	/uploads/SLIMEEEE.jpg	2026-01-12 15:56:01.713396-03	2026-01-17 11:39:29.400591-03	f	\N	f	t	\N	\N	none	1
28535	JUGUETES PISTOLA HOMBRE ARAÑA		PISTOLAAAAA	6600.00	12500.00	2.000	58	/uploads/PISTOLAAAAA.jpg	2026-01-12 15:56:01.717103-03	2026-01-17 11:39:29.40506-03	f	\N	f	t	\N	\N	none	1
28536	LIBRERIA CORRECTORES SIMBALL		CORRECTORESSSS	275.00	600.00	13.000	59	/uploads/CORRECTORESSSS.jpg	2026-01-12 15:56:01.720035-03	2026-01-17 11:39:29.408768-03	f	\N	f	t	\N	\N	none	1
28537	LIBRERIA TOYO CORRECTORES		CORRECTORESSS	220.00	500.00	7.000	59	/uploads/CORRECTORESSS.jpg	2026-01-12 15:56:01.723262-03	2026-01-17 11:39:29.411883-03	f	\N	f	t	\N	\N	none	1
28538	GOLOSINAS CHICLE BARBIE TATTOO		CHICLESSS	312.40	400.00	-13.000	18	/uploads/CHICLESSS.jpg	2026-01-12 15:56:01.726039-03	2026-01-17 11:39:29.414917-03	f	\N	f	t	\N	\N	none	1
28539	GOLOSINAS PINBALL GAME		PINBALLLLL	293.70	400.00	11.000	18	/uploads/PINBALLLLL.jpg	2026-01-12 15:56:01.728207-03	2026-01-17 11:39:29.417819-03	f	\N	f	t	\N	\N	none	1
28540	BODEGA DANTE ROBINO		DANTEEEEER	2127.40	2800.00	0.000	37	\N	2026-01-12 15:56:01.730277-03	2026-01-17 11:39:29.420511-03	f	\N	f	t	\N	\N	none	1
28542	GOLOSINAS CPITAN TRIPLE		CAPITANNNNM	1647.80	2100.00	-19.000	18	\N	2026-01-12 15:56:01.736193-03	2026-01-17 11:39:29.425208-03	f	\N	f	t	\N	\N	none	1
28544	ALMACEN MANI BLANCO		MANIIIIII	5115.00	7000.00	1.620	21	/uploads/MANIIIIII.jpg	2026-01-12 15:56:01.742894-03	2026-01-17 11:39:29.431469-03	f	\N	f	t	\N	\N	none	1
28545	ALMACEN GIACOMO		GIACOMOOOOOO	3482.60	3700.00	0.000	21	\N	2026-01-12 15:56:01.745283-03	2026-01-17 11:39:29.434665-03	f	\N	f	t	\N	\N	none	1
28548	CHOCOLATES COFLER AIR		COFLERRRRR	2428.80	2900.00	-6.000	32	/uploads/COFLERRRRR.jpg	2026-01-12 15:56:01.7521-03	2026-01-17 11:39:29.442277-03	f	\N	f	t	\N	\N	none	1
28549	CHOCOLATES COFLER AIR BLANCO , MIXTO		COFLERRRRRR	1280.40	1650.00	3.000	32	/uploads/COFLERRRRRR.jpg	2026-01-12 15:56:01.757697-03	2026-01-17 11:39:29.444687-03	f	\N	f	t	\N	\N	none	1
28550	GALLETITAS COFLER COOKIES		COFLERRRRRRRRRR	1174.80	1500.00	0.000	25	/uploads/COFLERRRRRRRRRR.jpg	2026-01-12 15:56:01.762044-03	2026-01-17 11:39:29.447291-03	f	\N	f	t	\N	\N	none	1
28551	GOLOSINAS CHICLE FLICS		CHICLEEEEE	457.60	650.00	1.000	18	/uploads/CHICLEEEEE.jpg	2026-01-12 15:56:01.766069-03	2026-01-17 11:39:29.449475-03	f	\N	f	t	\N	\N	none	1
28552	BEBIDA CERVEZA IGUANA		IGUANAA	1870.00	2200.00	0.000	19	/uploads/IGUANAA.jpg	2026-01-12 15:56:01.770337-03	2026-01-17 11:39:29.451638-03	f	\N	f	t	\N	\N	none	1
28553	ART VARIOS KOLYNOS CREMA DENTAL		KOLYNOSS	1595.00	2000.00	5.000	33	/uploads/KOLYNOSS.jpg	2026-01-12 15:56:01.773942-03	2026-01-17 11:39:29.453711-03	f	\N	f	t	\N	\N	none	1
28554	FARMACIA TE VIVITA ROLFITA		TEEEEEEE	770.00	1400.00	-2.000	30	/uploads/TEEEEEEE.jpg	2026-01-12 15:56:01.777938-03	2026-01-17 11:39:29.456942-03	f	\N	f	t	\N	\N	none	1
28555	ART VARIOS OCB SUELTO		PAPELILLOOOOOOPP	26.40	100.00	-5.000	39	/uploads/PAPELILLOOOOOOPP.jpg	2026-01-12 15:56:01.782149-03	2026-01-17 11:39:29.45995-03	f	\N	f	t	\N	\N	none	1
28510	ART.LIMPIEZA RSPONJA DE ACERO		ESPONJAAAAA	550.00	1000.00	8.000	29	/uploads/ESPONJAAAAA.jpg	2026-01-12 15:56:01.623805-03	2026-01-17 11:39:29.322654-03	f	\N	f	t	\N	\N	none	1
28517	GOLOSINAS NUCITA BICOLOR		NUCITAAAAAAA	183.70	300.00	22.000	18	/uploads/NUCITAAAAAAA.jpg	2026-01-12 15:56:01.647974-03	2026-01-17 11:39:29.341829-03	f	\N	f	t	\N	\N	none	1
28541	ART VARIOS QUTEX QUITA ESMALTE		QUITAAAAAAA	1326.60	1700.00	0.000	39	/uploads/QUITAAAAAAA.jpg	2026-01-12 15:56:01.732541-03	2026-01-17 11:39:29.422933-03	f	\N	f	t	\N	\N	none	1
28543	ART VARIOS SILICONA BARRA		SILICONAAAAA	110.00	300.00	11.000	39	/uploads/SILICONAAAAA.jpg	2026-01-12 15:56:01.739954-03	2026-01-17 11:39:29.428496-03	f	\N	f	t	\N	\N	none	1
28546	ALMACEN ACEITUNAS CON CAROZO		ACEITUNASSSD	4631.00	6000.00	-1.040	21	\N	2026-01-12 15:56:01.747498-03	2026-01-17 11:39:29.437463-03	f	\N	f	t	\N	\N	none	1
28547	GOLOSINAS LOLLIPOP CHUPETIN		CHUPETINNNNNNN	275.00	350.00	1.000	18	/uploads/CHUPETINNNNNNN.jpg	2026-01-12 15:56:01.749617-03	2026-01-17 11:39:29.439725-03	f	\N	f	t	\N	\N	none	1
\.


--
-- TOC entry 5158 (class 0 OID 25900)
-- Dependencies: 242
-- Data for Name: purchase_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchase_items (id, purchase_id, product_id, quantity, price_buy, subtotal) FROM stdin;
1	f7552807-3165-4307-8adb-d074fe3376cf	26671	2.00	475.00	950.00
2	03cdc92e-fc69-47a9-a15c-bbd851c52017	27672	1752.00	1100.00	1927200.00
3	0b842d59-983a-4d6f-9b72-a58680bb4c55	27672	15.00	1100.00	16500.00
4	c8693cbd-1f96-4a33-8594-4f830f1d5977	27672	10.00	1100.00	11000.00
5	ee46df2a-5a0e-43ef-9f5e-7ce2e50f5457	27672	7.00	1100.00	7700.00
6	835ed5ca-2ca2-42bd-b67d-b092593223d8	27672	1.00	1100.00	1100.00
7	c49b89bf-fd30-4dcf-b468-18e8f6599d46	27672	4.00	1100.00	4400.00
8	6232e0c7-dd1e-4f13-a6d5-1b161c3797a1	28740	2.00	2000.00	4000.00
9	df3d40db-3de2-49e8-9242-f2f6000889d8	27672	178.00	1650.00	293700.00
10	eb963e12-41b5-4b08-978c-2a4b0fb2ccee	28740	1.00	2000.00	2000.00
\.


--
-- TOC entry 5160 (class 0 OID 25910)
-- Dependencies: 244
-- Data for Name: purchases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.purchases (id, business_id, user_id, total, notes, created_at) FROM stdin;
f7552807-3165-4307-8adb-d074fe3376cf	1	1	950.00	Ajuste de stock: +2	2026-01-14 01:10:21.154855-03
03cdc92e-fc69-47a9-a15c-bbd851c52017	1	1	1927200.00	Ajuste de stock: +1752	2026-01-14 01:37:58.572325-03
0b842d59-983a-4d6f-9b72-a58680bb4c55	1	1	16500.00	Ajuste de stock: +15	2026-01-14 01:38:59.076197-03
c8693cbd-1f96-4a33-8594-4f830f1d5977	1	1	11000.00	Ajuste de stock: +10	2026-01-14 02:04:55.601004-03
ee46df2a-5a0e-43ef-9f5e-7ce2e50f5457	1	1	7700.00	Ajuste de stock: +7	2026-01-14 02:06:04.851034-03
835ed5ca-2ca2-42bd-b67d-b092593223d8	1	1	1100.00	Ajuste de stock: +1	2026-01-14 02:13:44.659583-03
c49b89bf-fd30-4dcf-b468-18e8f6599d46	1	1	4400.00	Ajuste de stock: +4	2026-01-16 17:02:35.21318-03
6232e0c7-dd1e-4f13-a6d5-1b161c3797a1	1	1	4000.00	Ajuste de stock: +2	2026-01-17 11:59:20.962647-03
df3d40db-3de2-49e8-9242-f2f6000889d8	1	1	293700.00	Ajuste de stock: +178	2026-01-17 11:59:58.077378-03
eb963e12-41b5-4b08-978c-2a4b0fb2ccee	1	1	2000.00	Ajuste de stock: +1	2026-01-17 12:20:02.698121-03
\.


--
-- TOC entry 5161 (class 0 OID 25921)
-- Dependencies: 245
-- Data for Name: sale_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sale_items (id, sale_id, product_id, quantity, price_unit, subtotal, cost_at_sale, discount_amount, promo_type, promo_buy, promo_pay, price_sell_at_sale, price_offer_at_sale, sell_by_weight) FROM stdin;
87	a91cf1c2-510c-40fb-b024-ece6e20f5630	26671	4.000	2362.50	9450.00	475.00	0.00	none	\N	\N	2362.50	\N	f
88	a91cf1c2-510c-40fb-b024-ece6e20f5630	26677	1.000	4387.50	4387.50	896.00	0.00	none	\N	\N	4387.50	\N	f
89	a91cf1c2-510c-40fb-b024-ece6e20f5630	27421	1.000	4725.00	4725.00	983.00	0.00	none	\N	\N	4725.00	\N	f
90	a91cf1c2-510c-40fb-b024-ece6e20f5630	27314	0.250	65812.50	16453.13	12876.00	0.00	none	\N	\N	65812.50	\N	t
91	deb4fe43-a51e-4eca-ac1e-99210820c38f	26776	1.000	6750.00	6750.00	1099.00	0.00	none	\N	\N	6750.00	\N	f
92	882b5c14-d7ae-48dd-8fe3-621cc2c6c107	28133	1.000	8100.00	8100.00	1600.00	0.00	none	\N	\N	8100.00	\N	f
93	85746bf8-e1e0-4cdd-9a2f-88313059ab24	27314	0.250	65812.50	16453.13	12876.00	0.00	none	\N	\N	65812.50	\N	t
94	5951f0be-c0c9-4536-a930-9a8f8af4aa26	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
95	ae6a3c11-325e-4bcc-b3fb-1baec7fbdfcc	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
96	6532ff58-63cc-4e9b-bc8f-ca5c6626353f	27672	0.500	5062.50	2531.25	1100.00	0.00	none	\N	\N	5062.50	\N	t
97	6532ff58-63cc-4e9b-bc8f-ca5c6626353f	27314	0.100	65812.50	6581.25	12876.00	0.00	none	\N	\N	65812.50	\N	t
98	6532ff58-63cc-4e9b-bc8f-ca5c6626353f	26708	1.000	5231.25	5231.25	900.00	0.00	none	\N	\N	5231.25	\N	f
99	93af6d36-100d-44e7-b1fe-ee3603dd7056	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
102	a26aa846-5864-4830-87b5-7a23642b9f53	27314	0.200	65812.50	13162.50	12876.00	0.00	none	\N	\N	65812.50	\N	t
103	e6961c09-61a2-4640-8ffb-e1a94606eadb	27314	0.200	65812.50	13162.50	12876.00	0.00	none	\N	\N	65812.50	\N	t
105	b4164b25-d599-45db-8e77-2736187512db	27314	0.500	65812.50	32906.25	12876.00	0.00	none	\N	\N	65812.50	\N	t
106	3b384064-8ddc-45f3-a529-f436fea0c0f9	27314	0.700	65812.50	46068.75	12876.00	0.00	none	\N	\N	65812.50	\N	t
107	6a530274-6473-4feb-96b9-9dcadbb00144	27314	0.700	65812.50	46068.75	12876.00	0.00	none	\N	\N	65812.50	\N	t
108	6a530274-6473-4feb-96b9-9dcadbb00144	27672	0.500	5062.50	2531.25	1100.00	0.00	none	\N	\N	5062.50	\N	t
109	f5bf5233-a11c-4d7d-bbc4-6134060fddea	26671	1.000	800.00	800.00	605.00	0.00	none	\N	\N	800.00	\N	f
110	9ac505f4-5933-4825-8cf1-05324512b06e	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
111	ed8af5c3-deb9-475e-99f1-bb24478c0264	28133	1.000	8100.00	8100.00	1600.00	0.00	none	\N	\N	8100.00	\N	f
112	54fa0512-c1e4-49e6-b673-5d8e03b83757	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
113	265a3cbf-2c0a-46dc-9228-7f0654ae0a68	27672	1.000	5062.50	5062.50	1100.00	0.00	none	\N	\N	5062.50	\N	t
114	6c6eedbf-f8a2-4402-a840-14c4366a9720	26671	1.000	800.00	800.00	605.00	0.00	none	\N	\N	800.00	\N	f
115	6fc63b2e-8bd7-4332-952b-6c0dd88f9846	27421	1.000	1600.00	1600.00	1343.00	0.00	none	\N	\N	1600.00	\N	f
116	518a61fd-4dfa-47e9-84d2-bf893b1ccebe	28740	3.000	2500.00	7500.00	2000.00	0.00	none	\N	\N	2500.00	\N	f
117	518a61fd-4dfa-47e9-84d2-bf893b1ccebe	27672	1.000	2000.00	2000.00	1650.00	0.00	none	\N	\N	2000.00	\N	t
118	518a61fd-4dfa-47e9-84d2-bf893b1ccebe	27314	0.100	19500.00	1950.00	14232.90	0.00	none	\N	\N	19500.00	\N	t
119	518a61fd-4dfa-47e9-84d2-bf893b1ccebe	27421	1.000	1600.00	1600.00	1343.10	0.00	none	\N	\N	1600.00	\N	f
\.


--
-- TOC entry 5163 (class 0 OID 25931)
-- Dependencies: 247
-- Data for Name: sales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sales (id, user_id, total, created_at, customer_id, payment_method, status, subtotal, cash_discount, business_id, amount_paid, change_given, debt_amount, settled_at, credit_applied, cash_register_id) FROM stdin;
e6961c09-61a2-4640-8ffb-e1a94606eadb	1	13162.50	2026-01-14 20:17:27.685-03	2092	Efectivo	pendiente	13162.50	0.00	1	10000.00	\N	18887.50	\N	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
b4164b25-d599-45db-8e77-2736187512db	1	32906.25	2026-01-14 20:29:36.244-03	2755	Efectivo	completado	32906.25	0.00	1	40000.00	7093.75	\N	2026-01-14 20:29:36.568019-03	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
3b384064-8ddc-45f3-a529-f436fea0c0f9	1	46068.75	2026-01-14 20:37:11.676-03	2755	Efectivo	completado	46068.75	0.00	1	48000.00	1931.25	\N	\N	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
6a530274-6473-4feb-96b9-9dcadbb00144	1	48600.00	2026-01-14 20:37:53.436-03	2755	Efectivo	completado	48600.00	0.00	1	50000.00	1400.00	\N	\N	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
a26aa846-5864-4830-87b5-7a23642b9f53	1	13162.50	2026-01-14 19:14:29.547-03	2092	Efectivo	pendiente	13162.50	0.00	1	\N	\N	13162.50	2026-01-14 21:49:52.860113-03	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
ae6a3c11-325e-4bcc-b3fb-1baec7fbdfcc	4	5062.50	2026-01-14 01:59:08.82-03	2092	Efectivo	pendiente	5062.50	0.00	1	2500.00	\N	7625.00	2026-01-14 21:50:10.861375-03	0.00	c896c781-f941-4ccb-af5b-63eba019ccfe
f5bf5233-a11c-4d7d-bbc4-6134060fddea	1	800.00	2026-01-14 21:52:13.419-03	2092	Efectivo	pendiente	800.00	0.00	1	\N	\N	800.00	2026-01-14 21:52:31.97768-03	0.00	\N
9ac505f4-5933-4825-8cf1-05324512b06e	1	5062.50	2026-01-14 21:53:55.496-03	2092	Efectivo	pendiente	5062.50	0.00	1	1000.00	\N	4062.50	2026-01-14 21:54:49.19531-03	0.00	\N
ed8af5c3-deb9-475e-99f1-bb24478c0264	1	8100.00	2026-01-15 00:51:06.821-03	2092	Efectivo	completado	8100.00	0.00	1	9000.00	900.00	\N	\N	0.00	\N
54fa0512-c1e4-49e6-b673-5d8e03b83757	1	5062.50	2026-01-15 02:56:12.313-03	2755	Efectivo	completado	5062.50	0.00	1	6000.00	937.50	\N	\N	0.00	\N
265a3cbf-2c0a-46dc-9228-7f0654ae0a68	1	5062.50	2026-01-15 02:56:55.72-03	2092	Efectivo	completado	5062.50	0.00	1	10000.00	4937.50	\N	\N	0.00	\N
6c6eedbf-f8a2-4402-a840-14c4366a9720	1	800.00	2026-01-15 02:58:44.831-03	2758	Efectivo	completado	800.00	0.00	1	1000.00	200.00	\N	\N	0.00	\N
6fc63b2e-8bd7-4332-952b-6c0dd88f9846	1	1600.00	2026-01-15 03:06:39.633-03	2758	Efectivo	completado	1600.00	0.00	1	2000.00	400.00	\N	\N	0.00	\N
a91cf1c2-510c-40fb-b024-ece6e20f5630	1	35015.63	2026-01-14 00:38:14.357-03	2755	Efectivo	completado	35015.63	0.00	1	36000.00	984.37	\N	\N	0.00	\N
deb4fe43-a51e-4eca-ac1e-99210820c38f	1	6750.00	2026-01-14 00:39:12.51-03	2755	Efectivo	completado	6750.00	0.00	1	7000.00	250.00	\N	\N	0.00	\N
882b5c14-d7ae-48dd-8fe3-621cc2c6c107	1	8100.00	2026-01-14 00:40:03.526-03	2755	Efectivo	completado	8100.00	0.00	1	8500.00	400.00	\N	\N	0.00	\N
85746bf8-e1e0-4cdd-9a2f-88313059ab24	4	16453.13	2026-01-14 01:57:13.629-03	2755	Efectivo	completado	16453.13	0.00	1	20000.00	3546.87	\N	\N	0.00	c896c781-f941-4ccb-af5b-63eba019ccfe
518a61fd-4dfa-47e9-84d2-bf893b1ccebe	1	13050.00	2026-01-17 12:02:02.926-03	2755	Efectivo	completado	13050.00	0.00	1	20000.00	6950.00	\N	\N	0.00	\N
6532ff58-63cc-4e9b-bc8f-ca5c6626353f	1	14343.75	2026-01-14 02:15:56.923-03	2755	Efectivo	completado	14343.75	0.00	1	20000.00	5656.25	\N	\N	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
5951f0be-c0c9-4536-a930-9a8f8af4aa26	4	5062.50	2026-01-14 01:58:16.452-03	2092	Efectivo	pendiente	5062.50	0.00	1	\N	\N	5062.50	2026-01-14 02:17:00.654807-03	0.00	c896c781-f941-4ccb-af5b-63eba019ccfe
93af6d36-100d-44e7-b1fe-ee3603dd7056	1	5062.50	2026-01-14 02:26:59.051-03	2755	Efectivo	completado	5062.50	0.00	1	10000.00	4937.50	\N	\N	0.00	864e1ad7-da2f-4da0-9b13-d2973fc452db
\.


--
-- TOC entry 5164 (class 0 OID 25944)
-- Dependencies: 248
-- Data for Name: settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.settings (id, key, value, created_at, business_id) FROM stdin;
1	cash_discount_percent	0	2026-01-05 13:35:29.589935-03	1
\.


--
-- TOC entry 5166 (class 0 OID 25954)
-- Dependencies: 250
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, username, password, role, created_at, updated_at, business_id) FROM stdin;
4	miguel	$2b$10$2KGKx/dEkA41V8VpVg6Fxe93xP4aCWLpPszxq/Fgy4mmW2IktoRqi	vendedor	2025-12-29 13:13:22.867047-03	2025-12-29 13:13:22.867047-03	1
1	admin	$2b$10$M/.4wx0HvjR4v7dd2y5Wd.5lyew9y9ANZguElFZgy8zaAnTog5N7G	admin	2025-12-28 10:43:07.593815-03	2025-12-28 10:43:07.593815-03	1
7	Francisco	$2b$10$pfo2bhSNsHXbu323BJQ10Ob.Nl4ljndQ7PD17h4S.S9mZBMIrC5hm	admin	2026-01-07 15:42:52.204589-03	2026-01-07 15:42:52.204589-03	1
8	Lucas	$2b$10$Y/xxesCER1EOefuy15SFtuxXtOH3cQ8ntrrGR1ZNg8.a8WWKLbD4S	vendedor	2026-01-07 15:43:11.621427-03	2026-01-07 15:43:11.621427-03	1
\.


--
-- TOC entry 5194 (class 0 OID 0)
-- Dependencies: 220
-- Name: businesses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.businesses_id_seq', 1, true);


--
-- TOC entry 5195 (class 0 OID 0)
-- Dependencies: 222
-- Name: cash_movements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.cash_movements_id_seq', 2, true);


--
-- TOC entry 5196 (class 0 OID 0)
-- Dependencies: 225
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 66, true);


--
-- TOC entry 5197 (class 0 OID 0)
-- Dependencies: 227
-- Name: customer_account_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customer_account_transactions_id_seq', 99, true);


--
-- TOC entry 5198 (class 0 OID 0)
-- Dependencies: 229
-- Name: customers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.customers_id_seq', 2772, true);


--
-- TOC entry 5199 (class 0 OID 0)
-- Dependencies: 231
-- Name: knex_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_id_seq', 42, true);


--
-- TOC entry 5200 (class 0 OID 0)
-- Dependencies: 233
-- Name: knex_migrations_lock_index_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.knex_migrations_lock_index_seq', 1, true);


--
-- TOC entry 5201 (class 0 OID 0)
-- Dependencies: 235
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 7, true);


--
-- TOC entry 5202 (class 0 OID 0)
-- Dependencies: 237
-- Name: pending_sales_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pending_sales_id_seq', 138, true);


--
-- TOC entry 5203 (class 0 OID 0)
-- Dependencies: 239
-- Name: pending_sales_multiple_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pending_sales_multiple_id_seq', 1, false);


--
-- TOC entry 5204 (class 0 OID 0)
-- Dependencies: 241
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 28740, true);


--
-- TOC entry 5205 (class 0 OID 0)
-- Dependencies: 243
-- Name: purchase_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.purchase_items_id_seq', 10, true);


--
-- TOC entry 5206 (class 0 OID 0)
-- Dependencies: 246
-- Name: sale_items_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sale_items_id_seq', 119, true);


--
-- TOC entry 5207 (class 0 OID 0)
-- Dependencies: 249
-- Name: settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.settings_id_seq', 1, true);


--
-- TOC entry 5208 (class 0 OID 0)
-- Dependencies: 251
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 8, true);


--
-- TOC entry 4905 (class 2606 OID 25985)
-- Name: businesses businesses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);


--
-- TOC entry 4907 (class 2606 OID 25987)
-- Name: businesses businesses_tax_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_tax_id_unique UNIQUE (tax_id);


--
-- TOC entry 4910 (class 2606 OID 25989)
-- Name: cash_movements cash_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_pkey PRIMARY KEY (id);


--
-- TOC entry 4914 (class 2606 OID 25991)
-- Name: cash_registers cash_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_pkey PRIMARY KEY (id);


--
-- TOC entry 4916 (class 2606 OID 25993)
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- TOC entry 4918 (class 2606 OID 25995)
-- Name: customer_account_transactions customer_account_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_transactions
    ADD CONSTRAINT customer_account_transactions_pkey PRIMARY KEY (id);


--
-- TOC entry 4920 (class 2606 OID 25997)
-- Name: customers customers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);


--
-- TOC entry 4924 (class 2606 OID 25999)
-- Name: knex_migrations_lock knex_migrations_lock_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations_lock
    ADD CONSTRAINT knex_migrations_lock_pkey PRIMARY KEY (index);


--
-- TOC entry 4922 (class 2606 OID 26001)
-- Name: knex_migrations knex_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.knex_migrations
    ADD CONSTRAINT knex_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4926 (class 2606 OID 26003)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4932 (class 2606 OID 26005)
-- Name: pending_sales_multiple pending_sales_multiple_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales_multiple
    ADD CONSTRAINT pending_sales_multiple_pkey PRIMARY KEY (id);


--
-- TOC entry 4928 (class 2606 OID 26007)
-- Name: pending_sales pending_sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales
    ADD CONSTRAINT pending_sales_pkey PRIMARY KEY (id);


--
-- TOC entry 4930 (class 2606 OID 26009)
-- Name: pending_sales pending_sales_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales
    ADD CONSTRAINT pending_sales_user_id_unique UNIQUE (user_id);


--
-- TOC entry 4936 (class 2606 OID 26011)
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- TOC entry 4938 (class 2606 OID 26013)
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- TOC entry 4940 (class 2606 OID 26015)
-- Name: purchase_items purchase_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4944 (class 2606 OID 26017)
-- Name: purchases purchases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_pkey PRIMARY KEY (id);


--
-- TOC entry 4946 (class 2606 OID 26019)
-- Name: sale_items sale_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 26021)
-- Name: sales sales_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_pkey PRIMARY KEY (id);


--
-- TOC entry 4951 (class 2606 OID 26023)
-- Name: settings settings_key_business_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_key_business_id_unique UNIQUE (key, business_id);


--
-- TOC entry 4953 (class 2606 OID 26025)
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- TOC entry 4955 (class 2606 OID 26027)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- TOC entry 4957 (class 2606 OID 26029)
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- TOC entry 4908 (class 1259 OID 26030)
-- Name: cash_movements_cash_register_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_movements_cash_register_id_index ON public.cash_movements USING btree (cash_register_id);


--
-- TOC entry 4911 (class 1259 OID 26031)
-- Name: cash_registers_business_id_opened_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_registers_business_id_opened_at_index ON public.cash_registers USING btree (business_id, opened_at);


--
-- TOC entry 4912 (class 1259 OID 26032)
-- Name: cash_registers_business_id_user_id_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cash_registers_business_id_user_id_status_index ON public.cash_registers USING btree (business_id, user_id, status);


--
-- TOC entry 4934 (class 1259 OID 26033)
-- Name: idx_products_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_name ON public.products USING btree (name);


--
-- TOC entry 4933 (class 1259 OID 26034)
-- Name: pending_sales_multiple_user_id_business_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX pending_sales_multiple_user_id_business_id_index ON public.pending_sales_multiple USING btree (user_id, business_id);


--
-- TOC entry 4941 (class 1259 OID 26035)
-- Name: purchase_items_purchase_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchase_items_purchase_id_index ON public.purchase_items USING btree (purchase_id);


--
-- TOC entry 4942 (class 1259 OID 26036)
-- Name: purchases_business_id_created_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX purchases_business_id_created_at_index ON public.purchases USING btree (business_id, created_at);


--
-- TOC entry 4947 (class 1259 OID 26037)
-- Name: sales_cash_register_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sales_cash_register_id_index ON public.sales USING btree (cash_register_id);


--
-- TOC entry 4958 (class 2606 OID 26038)
-- Name: cash_movements cash_movements_cash_register_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_movements
    ADD CONSTRAINT cash_movements_cash_register_id_foreign FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 26043)
-- Name: cash_registers cash_registers_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4960 (class 2606 OID 26048)
-- Name: cash_registers cash_registers_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cash_registers
    ADD CONSTRAINT cash_registers_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 26053)
-- Name: categories categories_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 26058)
-- Name: customer_account_transactions customer_account_transactions_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_transactions
    ADD CONSTRAINT customer_account_transactions_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 26063)
-- Name: customer_account_transactions customer_account_transactions_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_transactions
    ADD CONSTRAINT customer_account_transactions_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


--
-- TOC entry 4964 (class 2606 OID 26068)
-- Name: customer_account_transactions customer_account_transactions_sale_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customer_account_transactions
    ADD CONSTRAINT customer_account_transactions_sale_id_foreign FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE SET NULL;


--
-- TOC entry 4965 (class 2606 OID 26073)
-- Name: customers customers_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 26078)
-- Name: notifications notifications_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 26083)
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4968 (class 2606 OID 26088)
-- Name: pending_sales pending_sales_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales
    ADD CONSTRAINT pending_sales_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4969 (class 2606 OID 26093)
-- Name: pending_sales pending_sales_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales
    ADD CONSTRAINT pending_sales_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 4971 (class 2606 OID 26098)
-- Name: pending_sales_multiple pending_sales_multiple_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales_multiple
    ADD CONSTRAINT pending_sales_multiple_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4972 (class 2606 OID 26103)
-- Name: pending_sales_multiple pending_sales_multiple_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales_multiple
    ADD CONSTRAINT pending_sales_multiple_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 4973 (class 2606 OID 26108)
-- Name: pending_sales_multiple pending_sales_multiple_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales_multiple
    ADD CONSTRAINT pending_sales_multiple_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4970 (class 2606 OID 26113)
-- Name: pending_sales pending_sales_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_sales
    ADD CONSTRAINT pending_sales_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4974 (class 2606 OID 26118)
-- Name: products products_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4975 (class 2606 OID 26123)
-- Name: products products_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_foreign FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;


--
-- TOC entry 4976 (class 2606 OID 26128)
-- Name: purchase_items purchase_items_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- TOC entry 4977 (class 2606 OID 26133)
-- Name: purchase_items purchase_items_purchase_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchase_items
    ADD CONSTRAINT purchase_items_purchase_id_foreign FOREIGN KEY (purchase_id) REFERENCES public.purchases(id) ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 26138)
-- Name: purchases purchases_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4979 (class 2606 OID 26143)
-- Name: purchases purchases_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.purchases
    ADD CONSTRAINT purchases_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 26148)
-- Name: sale_items sale_items_product_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_product_id_foreign FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- TOC entry 4981 (class 2606 OID 26153)
-- Name: sale_items sale_items_sale_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sale_items
    ADD CONSTRAINT sale_items_sale_id_foreign FOREIGN KEY (sale_id) REFERENCES public.sales(id) ON DELETE CASCADE;


--
-- TOC entry 4982 (class 2606 OID 26158)
-- Name: sales sales_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4983 (class 2606 OID 26163)
-- Name: sales sales_cash_register_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_cash_register_id_foreign FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id) ON DELETE SET NULL;


--
-- TOC entry 4984 (class 2606 OID 26168)
-- Name: sales sales_customer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_customer_id_foreign FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE SET NULL;


--
-- TOC entry 4985 (class 2606 OID 26173)
-- Name: sales sales_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sales
    ADD CONSTRAINT sales_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- TOC entry 4986 (class 2606 OID 26178)
-- Name: settings settings_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


--
-- TOC entry 4987 (class 2606 OID 26183)
-- Name: users users_business_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_business_id_foreign FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;


-- Completed on 2026-01-17 14:37:39

--
-- PostgreSQL database dump complete
--

\unrestrict qSAj7lx2GxzbppQj14MpaE8VhIsaAag7D8lOoDIta5KcFW9t3MZUA57zR2UAHgt

