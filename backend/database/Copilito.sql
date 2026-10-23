--
-- PostgreSQL database dump
--

\restrict gdRyW9qLPvDQzfx2hatl38AHUD816E6oNAbdR6dyl1ulMXIFXiUTk0qYSAcUfDE

-- Dumped from database version 17.11
-- Dumped by pg_dump version 17.11

-- Started on 2026-10-22 23:59:03

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

--
-- TOC entry 2 (class 3079 OID 16425)
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;


--
-- TOC entry 5070 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- TOC entry 270 (class 1255 OID 16527)
-- Name: fn_muestra_requiere_consentimiento(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_muestra_requiere_consentimiento() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF NEW.origen = 'propio' THEN
    IF NOT EXISTS (
      SELECT 1
      FROM consentimiento c
      JOIN participante p ON p.id_participante = c.id_participante
      WHERE c.id_participante = NEW.id_participante
        AND c.fecha_revocacion IS NULL
        AND p.estado = 'activo'
    ) THEN
      RAISE EXCEPTION 'El participante no tiene un consentimiento vigente'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END $$;


ALTER FUNCTION public.fn_muestra_requiere_consentimiento() OWNER TO postgres;

--
-- TOC entry 271 (class 1255 OID 16529)
-- Name: fn_revocar_consentimiento(character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.fn_revocar_consentimiento(p_codigo character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
  v_id       uuid;
  v_borradas integer;
BEGIN
  SELECT id_participante INTO v_id FROM participante WHERE codigo = p_codigo;
  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Participante no encontrado: %', p_codigo
      USING ERRCODE = 'no_data_found';
  END IF;

  UPDATE consentimiento SET fecha_revocacion = CURRENT_DATE
   WHERE id_participante = v_id AND fecha_revocacion IS NULL;
  UPDATE participante SET estado = 'revocado'
   WHERE id_participante = v_id;
  DELETE FROM muestra WHERE id_participante = v_id;
  GET DIAGNOSTICS v_borradas = ROW_COUNT;
  RETURN v_borradas;
END $$;


ALTER FUNCTION public.fn_revocar_consentimiento(p_codigo character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16531)
-- Name: administrador; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.administrador (
    id_admin integer NOT NULL,
    usuario character varying(50) NOT NULL,
    hash_contrasena text NOT NULL,
    creado_en timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.administrador OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16530)
-- Name: administrador_id_admin_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.administrador ALTER COLUMN id_admin ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.administrador_id_admin_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 221 (class 1259 OID 16476)
-- Name: consentimiento; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.consentimiento (
    id_consentimiento integer NOT NULL,
    id_participante uuid NOT NULL,
    fecha date DEFAULT CURRENT_DATE NOT NULL,
    alcance text NOT NULL,
    version_formato character varying(20) NOT NULL,
    fecha_revocacion date,
    CONSTRAINT ck_consentimiento_fechas CHECK (((fecha_revocacion IS NULL) OR (fecha_revocacion >= fecha)))
);


ALTER TABLE public.consentimiento OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 16475)
-- Name: consentimiento_id_consentimiento_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.consentimiento ALTER COLUMN id_consentimiento ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.consentimiento_id_consentimiento_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 231 (class 1259 OID 16578)
-- Name: intervencion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.intervencion (
    id_intervencion bigint NOT NULL,
    id_sesion uuid NOT NULL,
    orden integer NOT NULL,
    interlocutor character varying(6) NOT NULL,
    tipo character varying(4) NOT NULL,
    texto text NOT NULL,
    confianza numeric(4,3),
    confirmada boolean DEFAULT false NOT NULL,
    latencia_ms integer,
    creado_en timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_interv_coherencia CHECK (((((tipo)::text = 'sena'::text) AND ((interlocutor)::text = 'sordo'::text)) OR (((tipo)::text = 'voz'::text) AND ((interlocutor)::text = 'oyente'::text)))),
    CONSTRAINT ck_interv_confianza CHECK (((confianza IS NULL) OR (((tipo)::text = 'sena'::text) AND ((confianza >= (0)::numeric) AND (confianza <= (1)::numeric))))),
    CONSTRAINT ck_interv_interlocutor CHECK (((interlocutor)::text = ANY ((ARRAY['sordo'::character varying, 'oyente'::character varying])::text[]))),
    CONSTRAINT ck_interv_latencia CHECK (((latencia_ms IS NULL) OR (latencia_ms >= 0))),
    CONSTRAINT ck_interv_tipo CHECK (((tipo)::text = ANY ((ARRAY['sena'::character varying, 'voz'::character varying])::text[]))),
    CONSTRAINT intervencion_orden_check CHECK ((orden > 0))
);


ALTER TABLE public.intervencion OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 16577)
-- Name: intervencion_id_intervencion_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.intervencion ALTER COLUMN id_intervencion ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.intervencion_id_intervencion_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 232 (class 1259 OID 16600)
-- Name: metrica_sesion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.metrica_sesion (
    id_sesion uuid NOT NULL,
    total_senas integer DEFAULT 0 NOT NULL,
    aciertos_confirmados integer DEFAULT 0 NOT NULL,
    latencia_media_ms numeric(10,2),
    CONSTRAINT ck_metrica_aciertos CHECK (((aciertos_confirmados >= 0) AND (aciertos_confirmados <= total_senas))),
    CONSTRAINT metrica_sesion_total_senas_check CHECK ((total_senas >= 0))
);


ALTER TABLE public.metrica_sesion OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 16503)
-- Name: muestra; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.muestra (
    id_muestra uuid DEFAULT gen_random_uuid() NOT NULL,
    id_sena integer NOT NULL,
    id_participante uuid,
    origen character varying(7) NOT NULL,
    vector63 real[] NOT NULL,
    fecha_carga date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT ck_muestra_origen CHECK (((origen)::text = ANY ((ARRAY['publico'::character varying, 'propio'::character varying])::text[]))),
    CONSTRAINT ck_muestra_participante CHECK (((((origen)::text = 'propio'::text) AND (id_participante IS NOT NULL)) OR (((origen)::text = 'publico'::text) AND (id_participante IS NULL)))),
    CONSTRAINT ck_muestra_vector CHECK (((array_ndims(vector63) = 1) AND (array_length(vector63, 1) = 63) AND (array_position(vector63, NULL::real) IS NULL)))
);


ALTER TABLE public.muestra OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16463)
-- Name: participante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.participante (
    id_participante uuid DEFAULT gen_random_uuid() NOT NULL,
    codigo character varying(12) NOT NULL,
    fecha_registro date DEFAULT CURRENT_DATE NOT NULL,
    estado character varying(10) DEFAULT 'activo'::character varying NOT NULL,
    CONSTRAINT ck_participante_estado CHECK (((estado)::text = ANY ((ARRAY['activo'::character varying, 'revocado'::character varying])::text[])))
);


ALTER TABLE public.participante OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 16614)
-- Name: respuesta_sus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.respuesta_sus (
    id_sesion uuid NOT NULL,
    respuestas jsonb NOT NULL,
    puntaje numeric(5,2) NOT NULL,
    CONSTRAINT ck_sus_respuestas CHECK (((jsonb_typeof(respuestas) = 'array'::text) AND (jsonb_array_length(respuestas) = 10))),
    CONSTRAINT respuesta_sus_puntaje_check CHECK (((puntaje >= (0)::numeric) AND (puntaje <= (100)::numeric)))
);


ALTER TABLE public.respuesta_sus OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16492)
-- Name: sena; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sena (
    id_sena integer NOT NULL,
    glosa character varying(60) NOT NULL,
    descripcion text,
    archivo_animacion text,
    activa boolean DEFAULT true NOT NULL,
    CONSTRAINT ck_sena_glosa CHECK (((length(btrim((glosa)::text)) > 0) AND ((glosa)::text = upper(btrim((glosa)::text)))))
);


ALTER TABLE public.sena OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 16491)
-- Name: sena_id_sena_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.sena ALTER COLUMN id_sena ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.sena_id_sena_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 218 (class 1259 OID 16462)
-- Name: seq_codigo_participante; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.seq_codigo_participante
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.seq_codigo_participante OWNER TO postgres;

--
-- TOC entry 5084 (class 0 OID 0)
-- Dependencies: 218
-- Name: seq_codigo_participante; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.seq_codigo_participante OWNED BY public.participante.codigo;


--
-- TOC entry 229 (class 1259 OID 16562)
-- Name: sesion; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sesion (
    id_sesion uuid DEFAULT gen_random_uuid() NOT NULL,
    id_version integer NOT NULL,
    inicio timestamp with time zone DEFAULT now() NOT NULL,
    fin timestamp with time zone,
    CONSTRAINT ck_sesion_fechas CHECK (((fin IS NULL) OR (fin >= inicio)))
);


ALTER TABLE public.sesion OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 16542)
-- Name: version_modelo; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.version_modelo (
    id_version integer NOT NULL,
    id_admin integer NOT NULL,
    nombre character varying(40) NOT NULL,
    fecha_registro date DEFAULT CURRENT_DATE NOT NULL,
    ruta_artefacto text NOT NULL,
    exactitud numeric(5,4) NOT NULL,
    precision_ numeric(5,4) NOT NULL,
    sensibilidad numeric(5,4) NOT NULL,
    f1 numeric(5,4) NOT NULL,
    matriz_confusion jsonb,
    umbral_confianza numeric(3,2) DEFAULT 0.80 NOT NULL,
    vigente boolean DEFAULT false NOT NULL,
    CONSTRAINT ck_version_metricas CHECK ((((exactitud >= (0)::numeric) AND (exactitud <= (1)::numeric)) AND ((precision_ >= (0)::numeric) AND (precision_ <= (1)::numeric)) AND ((sensibilidad >= (0)::numeric) AND (sensibilidad <= (1)::numeric)) AND ((f1 >= (0)::numeric) AND (f1 <= (1)::numeric)))),
    CONSTRAINT ck_version_umbral CHECK (((umbral_confianza >= (0)::numeric) AND (umbral_confianza <= (1)::numeric)))
);


ALTER TABLE public.version_modelo OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16541)
-- Name: version_modelo_id_version_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.version_modelo ALTER COLUMN id_version ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.version_modelo_id_version_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 4823 (class 2604 OID 16467)
-- Name: participante codigo; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participante ALTER COLUMN codigo SET DEFAULT ('PART-'::text || lpad((nextval('public.seq_codigo_participante'::regclass))::text, 3, '0'::text));


--
-- TOC entry 5057 (class 0 OID 16531)
-- Dependencies: 226
-- Data for Name: administrador; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.administrador (id_admin, usuario, hash_contrasena, creado_en) FROM stdin;
\.


--
-- TOC entry 5052 (class 0 OID 16476)
-- Dependencies: 221
-- Data for Name: consentimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.consentimiento (id_consentimiento, id_participante, fecha, alcance, version_formato, fecha_revocacion) FROM stdin;
\.


--
-- TOC entry 5062 (class 0 OID 16578)
-- Dependencies: 231
-- Data for Name: intervencion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.intervencion (id_intervencion, id_sesion, orden, interlocutor, tipo, texto, confianza, confirmada, latencia_ms, creado_en) FROM stdin;
\.


--
-- TOC entry 5063 (class 0 OID 16600)
-- Dependencies: 232
-- Data for Name: metrica_sesion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.metrica_sesion (id_sesion, total_senas, aciertos_confirmados, latencia_media_ms) FROM stdin;
\.


--
-- TOC entry 5055 (class 0 OID 16503)
-- Dependencies: 224
-- Data for Name: muestra; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.muestra (id_muestra, id_sena, id_participante, origen, vector63, fecha_carga) FROM stdin;
\.


--
-- TOC entry 5050 (class 0 OID 16463)
-- Dependencies: 219
-- Data for Name: participante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.participante (id_participante, codigo, fecha_registro, estado) FROM stdin;
\.


--
-- TOC entry 5064 (class 0 OID 16614)
-- Dependencies: 233
-- Data for Name: respuesta_sus; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.respuesta_sus (id_sesion, respuestas, puntaje) FROM stdin;
\.


--
-- TOC entry 5054 (class 0 OID 16492)
-- Dependencies: 223
-- Data for Name: sena; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sena (id_sena, glosa, descripcion, archivo_animacion, activa) FROM stdin;
1	HOLA	Saludo de bienvenida	animaciones/hola.json	t
2	GRACIAS	Expresión de agradecimiento	animaciones/gracias.json	t
3	AYUDA	Solicitud de apoyo	animaciones/ayuda.json	t
4	BUENOS DÍAS	Saludo de la mañana	animaciones/buenos_dias.json	t
5	POR FAVOR	Fórmula de cortesía	animaciones/por_favor.json	t
\.


--
-- TOC entry 5060 (class 0 OID 16562)
-- Dependencies: 229
-- Data for Name: sesion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sesion (id_sesion, id_version, inicio, fin) FROM stdin;
\.


--
-- TOC entry 5059 (class 0 OID 16542)
-- Dependencies: 228
-- Data for Name: version_modelo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.version_modelo (id_version, id_admin, nombre, fecha_registro, ruta_artefacto, exactitud, precision_, sensibilidad, f1, matriz_confusion, umbral_confianza, vigente) FROM stdin;
\.


--
-- TOC entry 5089 (class 0 OID 0)
-- Dependencies: 225
-- Name: administrador_id_admin_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.administrador_id_admin_seq', 1, false);


--
-- TOC entry 5090 (class 0 OID 0)
-- Dependencies: 220
-- Name: consentimiento_id_consentimiento_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.consentimiento_id_consentimiento_seq', 1, true);


--
-- TOC entry 5091 (class 0 OID 0)
-- Dependencies: 230
-- Name: intervencion_id_intervencion_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.intervencion_id_intervencion_seq', 1, false);


--
-- TOC entry 5092 (class 0 OID 0)
-- Dependencies: 222
-- Name: sena_id_sena_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sena_id_sena_seq', 5, true);


--
-- TOC entry 5093 (class 0 OID 0)
-- Dependencies: 218
-- Name: seq_codigo_participante; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.seq_codigo_participante', 1, true);


--
-- TOC entry 5094 (class 0 OID 0)
-- Dependencies: 227
-- Name: version_modelo_id_version_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.version_modelo_id_version_seq', 1, false);


--
-- TOC entry 4875 (class 2606 OID 16538)
-- Name: administrador administrador_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT administrador_pkey PRIMARY KEY (id_admin);


--
-- TOC entry 4877 (class 2606 OID 16540)
-- Name: administrador administrador_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.administrador
    ADD CONSTRAINT administrador_usuario_key UNIQUE (usuario);


--
-- TOC entry 4864 (class 2606 OID 16484)
-- Name: consentimiento consentimiento_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consentimiento
    ADD CONSTRAINT consentimiento_pkey PRIMARY KEY (id_consentimiento);


--
-- TOC entry 4888 (class 2606 OID 16592)
-- Name: intervencion intervencion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervencion
    ADD CONSTRAINT intervencion_pkey PRIMARY KEY (id_intervencion);


--
-- TOC entry 4892 (class 2606 OID 16608)
-- Name: metrica_sesion metrica_sesion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metrica_sesion
    ADD CONSTRAINT metrica_sesion_pkey PRIMARY KEY (id_sesion);


--
-- TOC entry 4873 (class 2606 OID 16514)
-- Name: muestra muestra_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.muestra
    ADD CONSTRAINT muestra_pkey PRIMARY KEY (id_muestra);


--
-- TOC entry 4860 (class 2606 OID 16474)
-- Name: participante participante_codigo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participante
    ADD CONSTRAINT participante_codigo_key UNIQUE (codigo);


--
-- TOC entry 4862 (class 2606 OID 16472)
-- Name: participante participante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.participante
    ADD CONSTRAINT participante_pkey PRIMARY KEY (id_participante);


--
-- TOC entry 4894 (class 2606 OID 16622)
-- Name: respuesta_sus respuesta_sus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta_sus
    ADD CONSTRAINT respuesta_sus_pkey PRIMARY KEY (id_sesion);


--
-- TOC entry 4867 (class 2606 OID 16502)
-- Name: sena sena_glosa_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sena
    ADD CONSTRAINT sena_glosa_key UNIQUE (glosa);


--
-- TOC entry 4869 (class 2606 OID 16500)
-- Name: sena sena_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sena
    ADD CONSTRAINT sena_pkey PRIMARY KEY (id_sena);


--
-- TOC entry 4886 (class 2606 OID 16569)
-- Name: sesion sesion_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_pkey PRIMARY KEY (id_sesion);


--
-- TOC entry 4890 (class 2606 OID 16594)
-- Name: intervencion uq_intervencion_orden; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervencion
    ADD CONSTRAINT uq_intervencion_orden UNIQUE (id_sesion, orden);


--
-- TOC entry 4880 (class 2606 OID 16555)
-- Name: version_modelo version_modelo_nombre_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version_modelo
    ADD CONSTRAINT version_modelo_nombre_key UNIQUE (nombre);


--
-- TOC entry 4882 (class 2606 OID 16553)
-- Name: version_modelo version_modelo_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version_modelo
    ADD CONSTRAINT version_modelo_pkey PRIMARY KEY (id_version);


--
-- TOC entry 4870 (class 1259 OID 16526)
-- Name: idx_muestra_participante; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_muestra_participante ON public.muestra USING btree (id_participante);


--
-- TOC entry 4871 (class 1259 OID 16525)
-- Name: idx_muestra_sena; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_muestra_sena ON public.muestra USING btree (id_sena);


--
-- TOC entry 4883 (class 1259 OID 16575)
-- Name: idx_sesion_inicio; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_inicio ON public.sesion USING btree (inicio);


--
-- TOC entry 4884 (class 1259 OID 16576)
-- Name: idx_sesion_version; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sesion_version ON public.sesion USING btree (id_version);


--
-- TOC entry 4865 (class 1259 OID 16490)
-- Name: ux_consentimiento_vigente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_consentimiento_vigente ON public.consentimiento USING btree (id_participante) WHERE (fecha_revocacion IS NULL);


--
-- TOC entry 4878 (class 1259 OID 16561)
-- Name: ux_version_vigente; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX ux_version_vigente ON public.version_modelo USING btree (vigente) WHERE vigente;


--
-- TOC entry 4903 (class 2620 OID 16528)
-- Name: muestra trg_muestra_consentimiento; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trg_muestra_consentimiento BEFORE INSERT OR UPDATE ON public.muestra FOR EACH ROW EXECUTE FUNCTION public.fn_muestra_requiere_consentimiento();


--
-- TOC entry 4895 (class 2606 OID 16485)
-- Name: consentimiento consentimiento_id_participante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.consentimiento
    ADD CONSTRAINT consentimiento_id_participante_fkey FOREIGN KEY (id_participante) REFERENCES public.participante(id_participante) ON DELETE RESTRICT;


--
-- TOC entry 4900 (class 2606 OID 16595)
-- Name: intervencion intervencion_id_sesion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.intervencion
    ADD CONSTRAINT intervencion_id_sesion_fkey FOREIGN KEY (id_sesion) REFERENCES public.sesion(id_sesion) ON DELETE CASCADE;


--
-- TOC entry 4901 (class 2606 OID 16609)
-- Name: metrica_sesion metrica_sesion_id_sesion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.metrica_sesion
    ADD CONSTRAINT metrica_sesion_id_sesion_fkey FOREIGN KEY (id_sesion) REFERENCES public.sesion(id_sesion) ON DELETE CASCADE;


--
-- TOC entry 4896 (class 2606 OID 16520)
-- Name: muestra muestra_id_participante_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.muestra
    ADD CONSTRAINT muestra_id_participante_fkey FOREIGN KEY (id_participante) REFERENCES public.participante(id_participante) ON DELETE CASCADE;


--
-- TOC entry 4897 (class 2606 OID 16515)
-- Name: muestra muestra_id_sena_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.muestra
    ADD CONSTRAINT muestra_id_sena_fkey FOREIGN KEY (id_sena) REFERENCES public.sena(id_sena) ON DELETE RESTRICT;


--
-- TOC entry 4902 (class 2606 OID 16623)
-- Name: respuesta_sus respuesta_sus_id_sesion_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.respuesta_sus
    ADD CONSTRAINT respuesta_sus_id_sesion_fkey FOREIGN KEY (id_sesion) REFERENCES public.sesion(id_sesion) ON DELETE CASCADE;


--
-- TOC entry 4899 (class 2606 OID 16570)
-- Name: sesion sesion_id_version_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sesion
    ADD CONSTRAINT sesion_id_version_fkey FOREIGN KEY (id_version) REFERENCES public.version_modelo(id_version) ON DELETE RESTRICT;


--
-- TOC entry 4898 (class 2606 OID 16556)
-- Name: version_modelo version_modelo_id_admin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.version_modelo
    ADD CONSTRAINT version_modelo_id_admin_fkey FOREIGN KEY (id_admin) REFERENCES public.administrador(id_admin) ON DELETE RESTRICT;


--
-- TOC entry 5071 (class 0 OID 0)
-- Dependencies: 271
-- Name: FUNCTION fn_revocar_consentimiento(p_codigo character varying); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.fn_revocar_consentimiento(p_codigo character varying) TO lsc_app;


--
-- TOC entry 5072 (class 0 OID 0)
-- Dependencies: 226
-- Name: TABLE administrador; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.administrador TO lsc_app;


--
-- TOC entry 5073 (class 0 OID 0)
-- Dependencies: 225
-- Name: SEQUENCE administrador_id_admin_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.administrador_id_admin_seq TO lsc_app;


--
-- TOC entry 5074 (class 0 OID 0)
-- Dependencies: 221
-- Name: TABLE consentimiento; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,UPDATE ON TABLE public.consentimiento TO lsc_app;


--
-- TOC entry 5075 (class 0 OID 0)
-- Dependencies: 220
-- Name: SEQUENCE consentimiento_id_consentimiento_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.consentimiento_id_consentimiento_seq TO lsc_app;


--
-- TOC entry 5076 (class 0 OID 0)
-- Dependencies: 231
-- Name: TABLE intervencion; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.intervencion TO lsc_app;


--
-- TOC entry 5077 (class 0 OID 0)
-- Dependencies: 230
-- Name: SEQUENCE intervencion_id_intervencion_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.intervencion_id_intervencion_seq TO lsc_app;


--
-- TOC entry 5078 (class 0 OID 0)
-- Dependencies: 232
-- Name: TABLE metrica_sesion; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.metrica_sesion TO lsc_app;


--
-- TOC entry 5079 (class 0 OID 0)
-- Dependencies: 224
-- Name: TABLE muestra; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.muestra TO lsc_app;


--
-- TOC entry 5080 (class 0 OID 0)
-- Dependencies: 219
-- Name: TABLE participante; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.participante TO lsc_app;


--
-- TOC entry 5081 (class 0 OID 0)
-- Dependencies: 233
-- Name: TABLE respuesta_sus; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.respuesta_sus TO lsc_app;


--
-- TOC entry 5082 (class 0 OID 0)
-- Dependencies: 223
-- Name: TABLE sena; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sena TO lsc_app;


--
-- TOC entry 5083 (class 0 OID 0)
-- Dependencies: 222
-- Name: SEQUENCE sena_id_sena_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.sena_id_sena_seq TO lsc_app;


--
-- TOC entry 5085 (class 0 OID 0)
-- Dependencies: 218
-- Name: SEQUENCE seq_codigo_participante; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.seq_codigo_participante TO lsc_app;


--
-- TOC entry 5086 (class 0 OID 0)
-- Dependencies: 229
-- Name: TABLE sesion; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sesion TO lsc_app;


--
-- TOC entry 5087 (class 0 OID 0)
-- Dependencies: 228
-- Name: TABLE version_modelo; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.version_modelo TO lsc_app;


--
-- TOC entry 5088 (class 0 OID 0)
-- Dependencies: 227
-- Name: SEQUENCE version_modelo_id_version_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,USAGE ON SEQUENCE public.version_modelo_id_version_seq TO lsc_app;


-- Completed on 2026-10-22 23:59:03

--
-- PostgreSQL database dump complete
--

\unrestrict gdRyW9qLPvDQzfx2hatl38AHUD816E6oNAbdR6dyl1ulMXIFXiUTk0qYSAcUfDE

