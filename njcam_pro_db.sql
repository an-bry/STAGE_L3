-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : jeu. 15 oct. 2026 à 11:40
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `njcam_pro_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `auth_group`
--

CREATE TABLE `auth_group` (
  `id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `auth_group_permissions`
--

CREATE TABLE `auth_group_permissions` (
  `id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `auth_permission`
--

CREATE TABLE `auth_permission` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `content_type_id` int(11) NOT NULL,
  `codename` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `auth_permission`
--

INSERT INTO `auth_permission` (`id`, `name`, `content_type_id`, `codename`) VALUES
(1, 'Can add log entry', 1, 'add_logentry'),
(2, 'Can change log entry', 1, 'change_logentry'),
(3, 'Can delete log entry', 1, 'delete_logentry'),
(4, 'Can view log entry', 1, 'view_logentry'),
(5, 'Can add permission', 2, 'add_permission'),
(6, 'Can change permission', 2, 'change_permission'),
(7, 'Can delete permission', 2, 'delete_permission'),
(8, 'Can view permission', 2, 'view_permission'),
(9, 'Can add group', 3, 'add_group'),
(10, 'Can change group', 3, 'change_group'),
(11, 'Can delete group', 3, 'delete_group'),
(12, 'Can view group', 3, 'view_group'),
(13, 'Can add content type', 4, 'add_contenttype'),
(14, 'Can change content type', 4, 'change_contenttype'),
(15, 'Can delete content type', 4, 'delete_contenttype'),
(16, 'Can view content type', 4, 'view_contenttype'),
(17, 'Can add session', 5, 'add_session'),
(18, 'Can change session', 5, 'change_session'),
(19, 'Can delete session', 5, 'delete_session'),
(20, 'Can view session', 5, 'view_session'),
(21, 'Can add utilisateur', 6, 'add_utilisateur'),
(22, 'Can change utilisateur', 6, 'change_utilisateur'),
(23, 'Can delete utilisateur', 6, 'delete_utilisateur'),
(24, 'Can view utilisateur', 6, 'view_utilisateur'),
(25, 'Can add ticket', 7, 'add_ticket'),
(26, 'Can change ticket', 7, 'change_ticket'),
(27, 'Can delete ticket', 7, 'delete_ticket'),
(28, 'Can view ticket', 7, 'view_ticket'),
(29, 'Can add intervention', 8, 'add_intervention'),
(30, 'Can change intervention', 8, 'change_intervention'),
(31, 'Can delete intervention', 8, 'delete_intervention'),
(32, 'Can view intervention', 8, 'view_intervention'),
(33, 'Can add piece', 9, 'add_piece'),
(34, 'Can change piece', 9, 'change_piece'),
(35, 'Can delete piece', 9, 'delete_piece'),
(36, 'Can view piece', 9, 'view_piece'),
(37, 'Can add piece utilisee', 10, 'add_pieceutilisee'),
(38, 'Can change piece utilisee', 10, 'change_pieceutilisee'),
(39, 'Can delete piece utilisee', 10, 'delete_pieceutilisee'),
(40, 'Can view piece utilisee', 10, 'view_pieceutilisee'),
(41, 'Can add rapport', 11, 'add_rapport'),
(42, 'Can change rapport', 11, 'change_rapport'),
(43, 'Can delete rapport', 11, 'delete_rapport'),
(44, 'Can view rapport', 11, 'view_rapport'),
(45, 'Can add historique ticket', 12, 'add_historiqueticket'),
(46, 'Can change historique ticket', 12, 'change_historiqueticket'),
(47, 'Can delete historique ticket', 12, 'delete_historiqueticket'),
(48, 'Can view historique ticket', 12, 'view_historiqueticket'),
(49, 'Can add commentaire', 13, 'add_commentaire'),
(50, 'Can change commentaire', 13, 'change_commentaire'),
(51, 'Can delete commentaire', 13, 'delete_commentaire'),
(52, 'Can view commentaire', 13, 'view_commentaire'),
(53, 'Can add planification', 14, 'add_planification'),
(54, 'Can change planification', 14, 'change_planification'),
(55, 'Can delete planification', 14, 'delete_planification'),
(56, 'Can view planification', 14, 'view_planification'),
(57, 'Can add notification', 15, 'add_notification'),
(58, 'Can change notification', 15, 'change_notification'),
(59, 'Can delete notification', 15, 'delete_notification'),
(60, 'Can view notification', 15, 'view_notification'),
(61, 'Can add offre', 16, 'add_offre'),
(62, 'Can change offre', 16, 'change_offre'),
(63, 'Can delete offre', 16, 'delete_offre'),
(64, 'Can view offre', 16, 'view_offre'),
(65, 'Can add demande installation', 17, 'add_demandeinstallation'),
(66, 'Can change demande installation', 17, 'change_demandeinstallation'),
(67, 'Can delete demande installation', 17, 'delete_demandeinstallation'),
(68, 'Can view demande installation', 17, 'view_demandeinstallation'),
(69, 'Can add devis', 18, 'add_devis'),
(70, 'Can change devis', 18, 'change_devis'),
(71, 'Can delete devis', 18, 'delete_devis'),
(72, 'Can view devis', 18, 'view_devis'),
(73, 'Can add ligne devis', 19, 'add_lignedevis'),
(74, 'Can change ligne devis', 19, 'change_lignedevis'),
(75, 'Can delete ligne devis', 19, 'delete_lignedevis'),
(76, 'Can view ligne devis', 19, 'view_lignedevis'),
(77, 'Can add site', 20, 'add_site'),
(78, 'Can change site', 20, 'change_site'),
(79, 'Can delete site', 20, 'delete_site'),
(80, 'Can view site', 20, 'view_site'),
(81, 'Can add fichier site', 21, 'add_fichiersite'),
(82, 'Can change fichier site', 21, 'change_fichiersite'),
(83, 'Can delete fichier site', 21, 'delete_fichiersite'),
(84, 'Can view fichier site', 21, 'view_fichiersite'),
(85, 'Can add installation', 22, 'add_installation'),
(86, 'Can change installation', 22, 'change_installation'),
(87, 'Can delete installation', 22, 'delete_installation'),
(88, 'Can view installation', 22, 'view_installation'),
(89, 'Can add equipement', 23, 'add_equipement'),
(90, 'Can change equipement', 23, 'change_equipement'),
(91, 'Can delete equipement', 23, 'delete_equipement'),
(92, 'Can view equipement', 23, 'view_equipement'),
(93, 'Can add fichier installation', 24, 'add_fichierinstallation'),
(94, 'Can change fichier installation', 24, 'change_fichierinstallation'),
(95, 'Can delete fichier installation', 24, 'delete_fichierinstallation'),
(96, 'Can view fichier installation', 24, 'view_fichierinstallation'),
(97, 'Can add rapport installation', 25, 'add_rapportinstallation'),
(98, 'Can change rapport installation', 25, 'change_rapportinstallation'),
(99, 'Can delete rapport installation', 25, 'delete_rapportinstallation'),
(100, 'Can view rapport installation', 25, 'view_rapportinstallation'),
(101, 'Can add commentaire', 26, 'add_commentaire'),
(102, 'Can change commentaire', 26, 'change_commentaire'),
(103, 'Can delete commentaire', 26, 'delete_commentaire'),
(104, 'Can view commentaire', 26, 'view_commentaire'),
(105, 'Can add contrat', 27, 'add_contrat'),
(106, 'Can change contrat', 27, 'change_contrat'),
(107, 'Can delete contrat', 27, 'delete_contrat'),
(108, 'Can view contrat', 27, 'view_contrat'),
(109, 'Can add maintenance', 28, 'add_maintenance'),
(110, 'Can change maintenance', 28, 'change_maintenance'),
(111, 'Can delete maintenance', 28, 'delete_maintenance'),
(112, 'Can view maintenance', 28, 'view_maintenance'),
(113, 'Can add devis', 29, 'add_devis'),
(114, 'Can change devis', 29, 'change_devis'),
(115, 'Can delete devis', 29, 'delete_devis'),
(116, 'Can view devis', 29, 'view_devis'),
(117, 'Can add ligne devis', 30, 'add_lignedevis'),
(118, 'Can change ligne devis', 30, 'change_lignedevis'),
(119, 'Can delete ligne devis', 30, 'delete_lignedevis'),
(120, 'Can view ligne devis', 30, 'view_lignedevis'),
(121, 'Can add piece demandee', 31, 'add_piecedemandee'),
(122, 'Can change piece demandee', 31, 'change_piecedemandee'),
(123, 'Can delete piece demandee', 31, 'delete_piecedemandee'),
(124, 'Can view piece demandee', 31, 'view_piecedemandee');

-- --------------------------------------------------------

--
-- Structure de la table `commentaire`
--

CREATE TABLE `commentaire` (
  `id` bigint(20) NOT NULL,
  `contenu` longtext NOT NULL,
  `visibilite` varchar(7) NOT NULL,
  `date` datetime(6) NOT NULL,
  `auteur_id` bigint(20) DEFAULT NULL,
  `ticket_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `commentaire_camtrack`
--

CREATE TABLE `commentaire_camtrack` (
  `id` bigint(20) NOT NULL,
  `contenu` longtext NOT NULL,
  `visibilite` varchar(7) NOT NULL,
  `date` datetime(6) NOT NULL,
  `auteur_id` bigint(20) DEFAULT NULL,
  `demande_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `commentaire_camtrack`
--

INSERT INTO `commentaire_camtrack` (`id`, `contenu`, `visibilite`, `date`, `auteur_id`, `demande_id`) VALUES
(1, 'Efa valideko ilay demande Mr jules', 'PUBLIC', '2026-10-05 07:42:56.944527', 3, 1),
(2, 'kz', 'PUBLIC', '2026-10-05 11:46:45.587071', 2, 1),
(3, 'yo', 'INTERNE', '2026-10-05 11:50:17.397707', 2, 1);

-- --------------------------------------------------------

--
-- Structure de la table `contrat`
--

CREATE TABLE `contrat` (
  `id` bigint(20) NOT NULL,
  `date_debut` date NOT NULL,
  `date_fin` date NOT NULL,
  `client_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `contrat_equipements`
--

CREATE TABLE `contrat_equipements` (
  `id` bigint(20) NOT NULL,
  `contrat_id` bigint(20) NOT NULL,
  `equipement_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `demande_installation`
--

CREATE TABLE `demande_installation` (
  `id` bigint(20) NOT NULL,
  `date_soumission` date NOT NULL,
  `statut` varchar(10) NOT NULL,
  `client_id` bigint(20) NOT NULL,
  `description` longtext NOT NULL,
  `offre_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `demande_installation`
--

INSERT INTO `demande_installation` (`id`, `date_soumission`, `statut`, `client_id`, `description`, `offre_id`) VALUES
(1, '2026-10-05', 'VALIDEE', 3, 'mila an\'io caméra io zahay fa mbvola tokony iampy kely le izyf a tsy io irery', 1),
(2, '2026-10-05', 'VALIDEE', 3, 'mety tsara izy ty', 1);

-- --------------------------------------------------------

--
-- Structure de la table `devis`
--

CREATE TABLE `devis` (
  `id` bigint(20) NOT NULL,
  `montant` int(11) NOT NULL,
  `date_etablissement` date NOT NULL,
  `demande_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `devis`
--

INSERT INTO `devis` (`id`, `montant`, `date_etablissement`, `demande_id`) VALUES
(1, 215000, '2026-10-05', 1),
(2, 450000, '2026-10-05', 2);

-- --------------------------------------------------------

--
-- Structure de la table `django_admin_log`
--

CREATE TABLE `django_admin_log` (
  `id` int(11) NOT NULL,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext DEFAULT NULL,
  `object_repr` varchar(200) NOT NULL,
  `action_flag` smallint(5) UNSIGNED NOT NULL CHECK (`action_flag` >= 0),
  `change_message` longtext NOT NULL,
  `content_type_id` int(11) DEFAULT NULL,
  `user_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `django_content_type`
--

CREATE TABLE `django_content_type` (
  `id` int(11) NOT NULL,
  `app_label` varchar(100) NOT NULL,
  `model` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `django_content_type`
--

INSERT INTO `django_content_type` (`id`, `app_label`, `model`) VALUES
(6, 'accounts', 'utilisateur'),
(1, 'admin', 'logentry'),
(3, 'auth', 'group'),
(2, 'auth', 'permission'),
(26, 'camtrack', 'commentaire'),
(17, 'camtrack', 'demandeinstallation'),
(18, 'camtrack', 'devis'),
(23, 'camtrack', 'equipement'),
(24, 'camtrack', 'fichierinstallation'),
(21, 'camtrack', 'fichiersite'),
(22, 'camtrack', 'installation'),
(19, 'camtrack', 'lignedevis'),
(16, 'camtrack', 'offre'),
(25, 'camtrack', 'rapportinstallation'),
(20, 'camtrack', 'site'),
(4, 'contenttypes', 'contenttype'),
(27, 'securitrack', 'contrat'),
(28, 'securitrack', 'maintenance'),
(5, 'sessions', 'session'),
(13, 'smart_ticket', 'commentaire'),
(29, 'smart_ticket', 'devis'),
(12, 'smart_ticket', 'historiqueticket'),
(8, 'smart_ticket', 'intervention'),
(30, 'smart_ticket', 'lignedevis'),
(15, 'smart_ticket', 'notification'),
(9, 'smart_ticket', 'piece'),
(31, 'smart_ticket', 'piecedemandee'),
(10, 'smart_ticket', 'pieceutilisee'),
(14, 'smart_ticket', 'planification'),
(11, 'smart_ticket', 'rapport'),
(7, 'smart_ticket', 'ticket');

-- --------------------------------------------------------

--
-- Structure de la table `django_migrations`
--

CREATE TABLE `django_migrations` (
  `id` bigint(20) NOT NULL,
  `app` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `applied` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `django_migrations`
--

INSERT INTO `django_migrations` (`id`, `app`, `name`, `applied`) VALUES
(1, 'contenttypes', '0001_initial', '2026-09-18 09:46:31.970579'),
(2, 'contenttypes', '0002_remove_content_type_name', '2026-09-18 09:46:32.015085'),
(3, 'auth', '0001_initial', '2026-09-18 09:46:32.208057'),
(4, 'auth', '0002_alter_permission_name_max_length', '2026-09-18 09:46:32.256272'),
(5, 'auth', '0003_alter_user_email_max_length', '2026-09-18 09:46:32.261846'),
(6, 'auth', '0004_alter_user_username_opts', '2026-09-18 09:46:32.267791'),
(7, 'auth', '0005_alter_user_last_login_null', '2026-09-18 09:46:32.275921'),
(8, 'auth', '0006_require_contenttypes_0002', '2026-09-18 09:46:32.279248'),
(9, 'auth', '0007_alter_validators_add_error_messages', '2026-09-18 09:46:32.285171'),
(10, 'auth', '0008_alter_user_username_max_length', '2026-09-18 09:46:32.293122'),
(11, 'auth', '0009_alter_user_last_name_max_length', '2026-09-18 09:46:32.299994'),
(12, 'auth', '0010_alter_group_name_max_length', '2026-09-18 09:46:32.312117'),
(13, 'auth', '0011_update_proxy_permissions', '2026-09-18 09:46:32.318527'),
(14, 'auth', '0012_alter_user_first_name_max_length', '2026-09-18 09:46:32.325092'),
(15, 'accounts', '0001_initial', '2026-09-18 09:46:32.590308'),
(16, 'admin', '0001_initial', '2026-09-18 09:46:32.698766'),
(17, 'admin', '0002_logentry_remove_auto_add', '2026-09-18 09:46:32.706332'),
(18, 'admin', '0003_logentry_add_action_flag_choices', '2026-09-18 09:46:32.716284'),
(19, 'camtrack', '0001_initial', '2026-09-18 09:46:33.166886'),
(20, 'securitrack', '0001_initial', '2026-09-18 09:46:33.367077'),
(21, 'sessions', '0001_initial', '2026-09-18 09:46:33.409697'),
(22, 'smart_ticket', '0001_initial', '2026-09-18 09:46:34.145184'),
(23, 'accounts', '0002_alter_utilisateur_options_alter_utilisateur_table', '2026-09-18 10:00:04.056129'),
(24, 'camtrack', '0002_alter_demandeinstallation_table_alter_devis_table_and_more', '2026-09-18 10:00:04.137196'),
(25, 'securitrack', '0002_alter_contrat_table_alter_maintenance_table', '2026-09-18 10:00:04.174512'),
(26, 'smart_ticket', '0002_alter_intervention_table_alter_photo_table_and_more', '2026-09-18 10:00:04.269979'),
(27, 'smart_ticket', '0003_remove_rapport_intervention_and_more', '2026-09-21 12:18:34.810926'),
(28, 'smart_ticket', '0004_rapport', '2026-09-21 12:49:51.760325'),
(29, 'smart_ticket', '0005_alter_intervention_options_and_more', '2026-09-23 09:16:31.438867'),
(30, 'smart_ticket', '0006_historiqueticket', '2026-09-23 09:59:44.999956'),
(31, 'smart_ticket', '0007_commentaire', '2026-09-23 10:29:57.998922'),
(32, 'smart_ticket', '0008_alter_historiqueticket_champ_modifie_planification', '2026-09-23 10:47:10.499979'),
(33, 'smart_ticket', '0009_intervention_cause_confirmee_and_more', '2026-09-23 10:57:31.834935'),
(34, 'smart_ticket', '0010_piece_alter_pieceutilisee_options_and_more', '2026-09-23 11:10:29.863335'),
(35, 'smart_ticket', '0011_notification', '2026-09-23 11:35:41.166837'),
(36, 'smart_ticket', '0012_ticket_priorite_modifiee_manuellement', '2026-09-23 12:35:22.115126'),
(37, 'camtrack', '0003_demandeinstallation_description_devis_commentaire_and_more', '2026-10-01 07:34:37.969274'),
(38, 'camtrack', '0004_fichiersite_offre_and_more', '2026-10-01 07:34:39.448413'),
(39, 'camtrack', '0005_lignedevis', '2026-10-01 08:22:40.957302'),
(40, 'camtrack', '0006_site_notes_faisabilite_site_technicien', '2026-10-01 10:37:26.332323'),
(41, 'camtrack', '0007_site_latitude_site_longitude', '2026-10-01 10:55:49.486863'),
(42, 'camtrack', '0008_fichierinstallation', '2026-10-01 11:25:01.568842'),
(43, 'camtrack', '0009_rapportinstallation', '2026-10-01 11:32:20.586726'),
(44, 'camtrack', '0010_commentaire', '2026-10-01 11:40:20.400322'),
(45, 'smart_ticket', '0013_devis_piecedemandee_lignedevis', '2026-10-06 07:45:11.381003'),
(46, 'securitrack', '0003_contrat_equipements_maintenance_compte_rendu_and_more', '2026-10-14 13:02:40.498494');

-- --------------------------------------------------------

--
-- Structure de la table `django_session`
--

CREATE TABLE `django_session` (
  `session_key` varchar(40) NOT NULL,
  `session_data` longtext NOT NULL,
  `expire_date` datetime(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `equipement`
--

CREATE TABLE `equipement` (
  `id` bigint(20) NOT NULL,
  `type_equipement` varchar(7) NOT NULL,
  `adresse_ip` char(39) DEFAULT NULL,
  `date_debut_garantie` date NOT NULL,
  `date_fin_garantie` date NOT NULL,
  `model` varchar(50) NOT NULL,
  `statut` varchar(12) NOT NULL,
  `installation_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `equipement`
--

INSERT INTO `equipement` (`id`, `type_equipement`, `adresse_ip`, `date_debut_garantie`, `date_fin_garantie`, `model`, `statut`, `installation_id`) VALUES
(1, 'CAMERA', NULL, '2026-10-05', '2027-11-05', 'Hikvision 4423', 'ACTIF', 1);

-- --------------------------------------------------------

--
-- Structure de la table `fichier_installation`
--

CREATE TABLE `fichier_installation` (
  `id` bigint(20) NOT NULL,
  `fichier` varchar(100) NOT NULL,
  `date_ajout` date NOT NULL,
  `installation_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `fichier_installation`
--

INSERT INTO `fichier_installation` (`id`, `fichier`, `date_ajout`, `installation_id`) VALUES
(1, 'installations/2026/10/images.jpg', '2026-10-05', 1);

-- --------------------------------------------------------

--
-- Structure de la table `fichier_site`
--

CREATE TABLE `fichier_site` (
  `id` bigint(20) NOT NULL,
  `type_fichier` varchar(5) NOT NULL,
  `fichier` varchar(100) NOT NULL,
  `date_ajout` date NOT NULL,
  `site_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `historique_ticket`
--

CREATE TABLE `historique_ticket` (
  `id` bigint(20) NOT NULL,
  `champ_modifie` varchar(20) NOT NULL,
  `ancienne_valeur` varchar(100) NOT NULL,
  `nouvelle_valeur` varchar(100) NOT NULL,
  `justification` longtext NOT NULL,
  `date` datetime(6) NOT NULL,
  `auteur_id` bigint(20) DEFAULT NULL,
  `ticket_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `historique_ticket`
--

INSERT INTO `historique_ticket` (`id`, `champ_modifie`, `ancienne_valeur`, `nouvelle_valeur`, `justification`, `date`, `auteur_id`, `ticket_id`) VALUES
(1, 'TECHNICIEN', 'Non affecté', 'Rivaldy', '', '2026-10-06 08:36:21.116358', 2, 1),
(2, 'STATUT', 'NOUVEAU', 'AFFECTE', '', '2026-10-06 08:36:21.122383', 2, 1),
(3, 'STATUT', 'AFFECTE', 'A_QUALIFIER', 'Diagnostic soumis, devis à établir', '2026-10-06 08:39:10.048639', 4, 1),
(4, 'TECHNICIEN', 'Non affecté', 'Rivaldy', '', '2026-10-06 10:33:12.013235', 2, 2),
(5, 'STATUT', 'NOUVEAU', 'AFFECTE', '', '2026-10-06 10:33:12.015322', 2, 2),
(6, 'STATUT', 'AFFECTE', 'A_QUALIFIER', 'Diagnostic soumis, devis à établir', '2026-10-06 10:58:59.826130', 4, 2),
(7, 'STATUT', 'A_QUALIFIER', 'EN_ATTENTE', 'Devis rév. 1 envoyé : 300000 Ar', '2026-10-06 12:18:31.673168', 2, 2),
(8, 'STATUT', 'EN_ATTENTE', 'EN_COURS', 'Devis rév. 1 accepté : 300000 Ar', '2026-10-06 12:19:10.053808', 3, 2),
(9, 'PLANIFICATION', '', '2026-10-10 à 06:20:00', '', '2026-10-06 12:20:37.826068', 2, 2),
(10, 'STATUT', 'EN_COURS', 'CLOTURE', '', '2026-10-06 12:22:10.245128', 3, 2);

-- --------------------------------------------------------

--
-- Structure de la table `installation`
--

CREATE TABLE `installation` (
  `id` bigint(20) NOT NULL,
  `date_installation` date DEFAULT NULL,
  `statut` varchar(10) NOT NULL,
  `site_id` bigint(20) NOT NULL,
  `technicien_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `installation`
--

INSERT INTO `installation` (`id`, `date_installation`, `statut`, `site_id`, `technicien_id`) VALUES
(1, '2026-10-17', 'TERMINEE', 1, 4),
(2, '2026-10-15', 'PLANIFIEE', 2, 4);

-- --------------------------------------------------------

--
-- Structure de la table `intervention`
--

CREATE TABLE `intervention` (
  `id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `statut` varchar(8) NOT NULL,
  `diagnostic` longtext NOT NULL,
  `validation_client` tinyint(1) NOT NULL,
  `technicien_id` bigint(20) NOT NULL,
  `ticket_id` bigint(20) NOT NULL,
  `cause_confirmee` varchar(200) NOT NULL,
  `cause_probable` varchar(200) NOT NULL,
  `checklist_securite` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`checklist_securite`)),
  `resultat_intervention` longtext NOT NULL,
  `symptomes_constates` longtext NOT NULL,
  `temps_passe_minutes` int(10) UNSIGNED DEFAULT NULL CHECK (`temps_passe_minutes` >= 0),
  `tests_effectues` longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `intervention`
--

INSERT INTO `intervention` (`id`, `date`, `statut`, `diagnostic`, `validation_client`, `technicien_id`, `ticket_id`, `cause_confirmee`, `cause_probable`, `checklist_securite`, `resultat_intervention`, `symptomes_constates`, `temps_passe_minutes`, `tests_effectues`) VALUES
(1, '2026-10-06', 'EN_COURS', 'may ny témoin an\'le télé', 0, 4, 1, 'courant', 'surchauffe', '[\"Client inform\\u00e9 de l\'intervention\", \"Risques identifi\\u00e9s et ma\\u00eetris\\u00e9s\"]', 'mila mividy témoin', 'may le témoin', NULL, 'tsy mbola nanao aloha'),
(2, '2026-10-06', 'VALIDEE', 'tsy mande DVR', 1, 4, 2, '', '', '[]', 'mande izy refa soloina', 'tsisy raha endrika ivelany', NULL, 'nosoloina dvr vaovaoi');

-- --------------------------------------------------------

--
-- Structure de la table `ligne_devis`
--

CREATE TABLE `ligne_devis` (
  `id` bigint(20) NOT NULL,
  `designation` varchar(150) NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL CHECK (`quantite` >= 0),
  `prix_unitaire` int(11) NOT NULL,
  `devis_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ligne_devis`
--

INSERT INTO `ligne_devis` (`id`, `designation`, `quantite`, `prix_unitaire`, `devis_id`) VALUES
(1, 'fil', 1, 5000, 1),
(2, 'quotien', 1, 200000, 1),
(3, 'Matériel', 1, 10000, 1),
(4, 'Fils', 1, 300000, 2),
(5, 'quotien', 1, 150000, 2);

-- --------------------------------------------------------

--
-- Structure de la table `maintenance`
--

CREATE TABLE `maintenance` (
  `id` bigint(20) NOT NULL,
  `type_maintenance` varchar(10) NOT NULL,
  `date` date NOT NULL,
  `equipement_id` bigint(20) NOT NULL,
  `technicien_id` bigint(20) DEFAULT NULL,
  `compte_rendu` longtext NOT NULL,
  `statut` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `notification`
--

CREATE TABLE `notification` (
  `id` bigint(20) NOT NULL,
  `message` varchar(255) NOT NULL,
  `lien` varchar(100) NOT NULL,
  `lu` tinyint(1) NOT NULL,
  `date` datetime(6) NOT NULL,
  `utilisateur_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `notification`
--

INSERT INTO `notification` (`id`, `message`, `lien`, `lu`, `date`, `utilisateur_id`) VALUES
(1, 'Votre demande d\'installation #1 a bien été reçue. Elle est en cours d\'examen.', 'demande:1', 1, '2026-10-05 07:36:50.788013', 3),
(2, 'Un devis de 215 000 Ar a été établi pour votre demande #1. Consultez-le pour l\'accepter ou le refuser.', 'demande:1', 1, '2026-10-05 07:41:30.246814', 3),
(3, 'Une étude de site vous a été affectée : « Manajary » (demande #1).', 'site:1', 0, '2026-10-05 07:41:38.996487', 4),
(4, 'Nouveau commentaire sur votre demande #1.', 'demande:1', 0, '2026-10-05 07:42:56.952822', 4),
(5, 'L\'étude de votre site « Manajary » est terminée : site validé.', 'demande:1', 1, '2026-10-05 07:46:04.041811', 3),
(6, 'Une installation vous a été planifiée : « Manajary ».', 'installation:1', 0, '2026-10-05 09:27:54.891267', 4),
(7, 'Une installation a été planifiée pour « Manajary ».', 'installation:1', 1, '2026-10-05 09:27:54.897599', 3),
(8, 'Nouveau commentaire sur votre demande #1.', 'demande:1', 1, '2026-10-05 11:46:45.596794', 3),
(9, 'Nouveau commentaire sur votre demande #1.', 'demande:1', 0, '2026-10-05 11:46:45.599075', 4),
(10, 'Nouveau commentaire sur votre demande #1.', 'demande:1', 0, '2026-10-05 11:50:17.404812', 4),
(11, 'Votre demande d\'installation #2 a bien été reçue. Elle est en cours d\'examen.', 'demande:2', 1, '2026-10-05 11:53:40.228036', 3),
(12, 'Une étude de site vous a été affectée : « Ihosy » (demande #2).', 'site:2', 0, '2026-10-05 11:55:24.856939', 4),
(13, 'L\'étude de votre site « Ihosy » est terminée : site validé.', 'demande:2', 1, '2026-10-05 11:56:33.160248', 3),
(14, 'Un devis de 450 000 Ar a été établi pour votre demande #2. Consultez-le pour l\'accepter ou le refuser.', 'demande:2', 1, '2026-10-05 11:57:44.501267', 3),
(15, 'Une installation vous a été planifiée : « Ihosy ».', 'installation:2', 0, '2026-10-05 12:00:13.266559', 4),
(16, 'Une installation a été planifiée pour « Ihosy ».', 'installation:2', 1, '2026-10-05 12:00:13.271445', 3),
(17, 'Votre ticket TCK-00001 a été affecté à un technicien.', 'ticket:1', 0, '2026-10-06 08:36:21.126816', 3),
(18, 'Un nouveau ticket TCK-00001 vous a été affecté.', 'ticket:1', 1, '2026-10-06 08:36:21.133024', 4),
(19, 'Diagnostic soumis sur le ticket TCK-00001 : devis à établir.', 'ticket:1', 1, '2026-10-06 08:39:10.052474', 2),
(20, 'Votre ticket TCK-00002 a été affecté à un technicien.', 'ticket:2', 0, '2026-10-06 10:33:12.019078', 3),
(21, 'Un nouveau ticket TCK-00002 vous a été affecté.', 'ticket:2', 0, '2026-10-06 10:33:12.021377', 4),
(22, 'Diagnostic soumis sur le ticket TCK-00002 : devis à établir.', 'ticket:2', 1, '2026-10-06 10:58:59.832416', 2),
(23, 'Un devis de 300000 Ar est disponible pour votre ticket TCK-00002. Merci de l\'accepter ou de le refuser.', 'ticket:2', 0, '2026-10-06 12:18:31.677942', 3),
(24, 'Le client a accepté le devis du ticket TCK-00002 : vous pouvez intervenir.', 'ticket:2', 0, '2026-10-06 12:19:10.069060', 4),
(25, 'Devis accepté par le client sur le ticket TCK-00002.', 'ticket:2', 1, '2026-10-06 12:19:10.072487', 2),
(26, 'Une intervention a été planifiée pour votre ticket TCK-00002 le 2026-10-10 à 06:20:00.', 'ticket:2', 0, '2026-10-06 12:20:37.830080', 3),
(27, 'Intervention planifiée le 2026-10-10 à 06:20:00 pour le ticket TCK-00002.', 'ticket:2', 0, '2026-10-06 12:20:37.833055', 4),
(28, 'L\'intervention sur votre ticket TCK-00002 est terminée, en attente de votre validation.', 'ticket:2', 0, '2026-10-06 12:21:40.146895', 3),
(29, 'Le client a validé l\'intervention sur le ticket TCK-00002, ticket clôturé.', 'ticket:2', 0, '2026-10-06 12:22:10.248357', 4);

-- --------------------------------------------------------

--
-- Structure de la table `offre`
--

CREATE TABLE `offre` (
  `id` bigint(20) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `description` longtext NOT NULL,
  `nombre_cameras_inclus` int(10) UNSIGNED NOT NULL CHECK (`nombre_cameras_inclus` >= 0),
  `prix_abonnement` int(11) NOT NULL,
  `duree_engagement_mois` int(10) UNSIGNED NOT NULL CHECK (`duree_engagement_mois` >= 0),
  `actif` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `offre`
--

INSERT INTO `offre` (`id`, `nom`, `description`, `nombre_cameras_inclus`, `prix_abonnement`, `duree_engagement_mois`, `actif`) VALUES
(1, 'Pack Noel', 'idéal pour maison et pour un magasin', 4, 101000, 12, 1);

-- --------------------------------------------------------

--
-- Structure de la table `piece_catalogue`
--

CREATE TABLE `piece_catalogue` (
  `id` bigint(20) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `designation` varchar(150) NOT NULL,
  `stock_actuel` int(10) UNSIGNED NOT NULL CHECK (`stock_actuel` >= 0),
  `lieu_stockage` varchar(100) NOT NULL,
  `prix_unitaire` int(10) UNSIGNED NOT NULL CHECK (`prix_unitaire` >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `piece_utilisee`
--

CREATE TABLE `piece_utilisee` (
  `id` bigint(20) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL CHECK (`quantite` >= 0),
  `intervention_id` bigint(20) NOT NULL,
  `prix_unitaire` int(10) UNSIGNED NOT NULL CHECK (`prix_unitaire` >= 0),
  `reference` varchar(50) NOT NULL,
  `numero_serie` varchar(100) NOT NULL,
  `piece_recuperee` tinyint(1) NOT NULL,
  `statut_piece` varchar(11) NOT NULL,
  `piece_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `piece_utilisee`
--

INSERT INTO `piece_utilisee` (`id`, `nom`, `quantite`, `intervention_id`, `prix_unitaire`, `reference`, `numero_serie`, `piece_recuperee`, `statut_piece`, `piece_id`) VALUES
(1, 'DVR', 1, 2, 400000, '', '', 0, 'REMPLACEE', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `planification`
--

CREATE TABLE `planification` (
  `id` bigint(20) NOT NULL,
  `date` date NOT NULL,
  `heure_debut` time(6) NOT NULL,
  `duree_estimee_minutes` int(10) UNSIGNED NOT NULL CHECK (`duree_estimee_minutes` >= 0),
  `statut` varchar(9) NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `technicien_id` bigint(20) NOT NULL,
  `ticket_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `planification`
--

INSERT INTO `planification` (`id`, `date`, `heure_debut`, `duree_estimee_minutes`, `statut`, `date_creation`, `technicien_id`, `ticket_id`) VALUES
(1, '2026-10-10', '06:20:00.000000', 60, 'PLANIFIEE', '2026-10-06 12:20:37.824199', 4, 2);

-- --------------------------------------------------------

--
-- Structure de la table `rapport`
--

CREATE TABLE `rapport` (
  `id` bigint(20) NOT NULL,
  `contenu` longtext NOT NULL,
  `type_rapport` varchar(13) NOT NULL,
  `date_creation` date NOT NULL,
  `intervention_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rapport`
--

INSERT INTO `rapport` (`id`, `contenu`, `type_rapport`, `date_creation`, `intervention_id`) VALUES
(1, 'Rapport d\'intervention #2\nTicket créé par : andrianilana thierrybryan — Raison : DVR tsy mande\nTechnicien : Rivaldy Rakoto\nDate : 2026-10-06\n\nDiagnostic :\ntsy mande DVR\n\nSymptômes constatés :\ntsisy raha endrika ivelany\n\nTests effectués :\nnosoloina dvr vaovaoi\n\nRésultat de l\'intervention :\nmande izy refa soloina\n\nPièces utilisées :\n- DVR x1 — 400000 Ar (sous-total : 400000 Ar)\n\nCoût total des pièces : 400000 Ar', 'INTERVENTION', '2026-10-06', 2);

-- --------------------------------------------------------

--
-- Structure de la table `rapport_installation`
--

CREATE TABLE `rapport_installation` (
  `id` bigint(20) NOT NULL,
  `contenu` longtext NOT NULL,
  `date_creation` date NOT NULL,
  `validation_client` tinyint(1) NOT NULL,
  `date_validation` datetime(6) DEFAULT NULL,
  `installation_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `rapport_installation`
--

INSERT INTO `rapport_installation` (`id`, `contenu`, `date_creation`, `validation_client`, `date_validation`, `installation_id`) VALUES
(1, 'Rapport d\'installation #1\nClient : andrianilana thierrybryan\nSite : Manajary — tsisy adiresy\nTechnicien : Rivaldy Rakoto\nDate d\'installation : 2026-10-17\n\nÉquipements installés :\n- Caméra — Hikvision 4423 (IP: non définie) — garantie du 2026-10-05 au 2027-11-05', '2026-10-05', 0, NULL, 1);

-- --------------------------------------------------------

--
-- Structure de la table `site`
--

CREATE TABLE `site` (
  `id` bigint(20) NOT NULL,
  `date_soumission` date NOT NULL,
  `statut` varchar(10) NOT NULL,
  `adresse_gps` varchar(50) NOT NULL,
  `demande_id` bigint(20) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `adresse` varchar(255) NOT NULL,
  `notes_faisabilite` longtext NOT NULL,
  `technicien_id` bigint(20) DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `site`
--

INSERT INTO `site` (`id`, `date_soumission`, `statut`, `adresse_gps`, `demande_id`, `nom`, `adresse`, `notes_faisabilite`, `technicien_id`, `latitude`, `longitude`) VALUES
(1, '2026-10-05', 'VALIDE', '-21.455810, 47.092205', 1, 'Manajary', 'tsisy adiresy', 'azo atao iany fa avo avo ilay izy ny tena marina', 4, -21.4558105, 47.0922045),
(2, '2026-10-05', 'VALIDE', '-21.455810, 47.092205', 2, 'Ihosy', 'tsy fantatra', 'mila fils be de be', 4, -21.4558105, 47.0922045);

-- --------------------------------------------------------

--
-- Structure de la table `ticket`
--

CREATE TABLE `ticket` (
  `id` bigint(20) NOT NULL,
  `date_creation` date NOT NULL,
  `priorite` varchar(8) NOT NULL,
  `statut` varchar(11) NOT NULL,
  `description` longtext NOT NULL,
  `client_id` bigint(20) NOT NULL,
  `technicien_id` bigint(20) DEFAULT NULL,
  `categorie` varchar(100) NOT NULL,
  `date_heure_apparition` datetime(6) DEFAULT NULL,
  `disponibilites_client` varchar(255) NOT NULL,
  `equipement` varchar(150) NOT NULL,
  `localisation_precise` varchar(200) NOT NULL,
  `niveau_impact` varchar(8) NOT NULL,
  `nombre_utilisateurs_affectes` int(10) UNSIGNED NOT NULL CHECK (`nombre_utilisateurs_affectes` >= 0),
  `site` varchar(150) NOT NULL,
  `sla_deadline` datetime(6) DEFAULT NULL,
  `priorite_modifiee_manuellement` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ticket`
--

INSERT INTO `ticket` (`id`, `date_creation`, `priorite`, `statut`, `description`, `client_id`, `technicien_id`, `categorie`, `date_heure_apparition`, `disponibilites_client`, `equipement`, `localisation_precise`, `niveau_impact`, `nombre_utilisateurs_affectes`, `site`, `sla_deadline`, `priorite_modifiee_manuellement`) VALUES
(1, '2026-10-06', 'MOYENNE', 'A_QUALIFIER', 'tsy mande le écran', 3, 4, 'Panne logicielle', '2026-09-30 08:35:00.000000', '', 'écran télévisé', '', 'ELEVE', 7, 'Ambatomena', NULL, 0),
(2, '2026-10-06', 'MOYENNE', 'CLOTURE', 'DVR tsy mande', 3, 4, 'Panne matérielle', '2026-09-28 10:26:00.000000', '', 'DVR CAMERA', '', 'MOYEN', 1, 'IHOSY', NULL, 0);

-- --------------------------------------------------------

--
-- Structure de la table `ticket_devis`
--

CREATE TABLE `ticket_devis` (
  `id` bigint(20) NOT NULL,
  `revision` int(10) UNSIGNED NOT NULL CHECK (`revision` >= 0),
  `statut` varchar(10) NOT NULL,
  `montant_main_oeuvre` int(10) UNSIGNED NOT NULL CHECK (`montant_main_oeuvre` >= 0),
  `remise` int(10) UNSIGNED NOT NULL CHECK (`remise` >= 0),
  `commentaire` longtext NOT NULL,
  `motif_refus` longtext NOT NULL,
  `date_creation` datetime(6) NOT NULL,
  `date_envoi` datetime(6) DEFAULT NULL,
  `date_reponse` datetime(6) DEFAULT NULL,
  `cree_par_id` bigint(20) DEFAULT NULL,
  `ticket_id` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ticket_devis`
--

INSERT INTO `ticket_devis` (`id`, `revision`, `statut`, `montant_main_oeuvre`, `remise`, `commentaire`, `motif_refus`, `date_creation`, `date_envoi`, `date_reponse`, `cree_par_id`, `ticket_id`) VALUES
(1, 1, 'ACCEPTE', 200000, 300000, '', '', '2026-10-06 12:18:25.785234', '2026-10-06 12:18:31.664438', '2026-10-06 12:19:10.047873', 2, 2);

-- --------------------------------------------------------

--
-- Structure de la table `ticket_ligne_devis`
--

CREATE TABLE `ticket_ligne_devis` (
  `id` bigint(20) NOT NULL,
  `designation` varchar(150) NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL CHECK (`quantite` >= 0),
  `prix_unitaire` int(10) UNSIGNED NOT NULL CHECK (`prix_unitaire` >= 0),
  `devis_id` bigint(20) NOT NULL,
  `piece_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ticket_ligne_devis`
--

INSERT INTO `ticket_ligne_devis` (`id`, `designation`, `quantite`, `prix_unitaire`, `devis_id`, `piece_id`) VALUES
(1, 'DVR', 1, 400000, 1, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `ticket_piece_demandee`
--

CREATE TABLE `ticket_piece_demandee` (
  `id` bigint(20) NOT NULL,
  `nom` varchar(100) NOT NULL,
  `reference` varchar(50) NOT NULL,
  `quantite` int(10) UNSIGNED NOT NULL CHECK (`quantite` >= 0),
  `intervention_id` bigint(20) NOT NULL,
  `piece_id` bigint(20) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `ticket_piece_demandee`
--

INSERT INTO `ticket_piece_demandee` (`id`, `nom`, `reference`, `quantite`, `intervention_id`, `piece_id`) VALUES
(1, 'DVR', 'DVR XP PRO', 1, 2, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur`
--

CREATE TABLE `utilisateur` (
  `id` bigint(20) NOT NULL,
  `password` varchar(128) NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) NOT NULL,
  `first_name` varchar(150) NOT NULL,
  `last_name` varchar(150) NOT NULL,
  `email` varchar(254) NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  `role` varchar(10) NOT NULL,
  `telephone` varchar(15) DEFAULT NULL,
  `raison_sociale` varchar(100) DEFAULT NULL,
  `specialite` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateur`
--

INSERT INTO `utilisateur` (`id`, `password`, `last_login`, `is_superuser`, `username`, `first_name`, `last_name`, `email`, `is_staff`, `is_active`, `date_joined`, `role`, `telephone`, `raison_sociale`, `specialite`) VALUES
(1, 'pbkdf2_sha256$600000$Zaz6bFjVs1moDqSKnMqR3O$lO4oB0SUMntTDbMnOoGFm6ZwB7SkauB7x1BGA2JiPH4=', NULL, 1, 'jules', '', '', 'jules@gmail.com', 1, 1, '2026-10-05 07:27:30.065082', '', NULL, NULL, NULL),
(2, 'pbkdf2_sha256$600000$d8qTeDiZ0tSTEYSQBeinqo$tbIprtw26C04nRxmDPzEQHMYxLvHKUiLNY4nFUQjK8E=', NULL, 0, 'Jules1', 'Armend', 'Rabe', 'armend@gmail.com', 0, 1, '2026-10-05 07:31:48.990294', 'ADMIN', '0349745608', NULL, NULL),
(3, 'pbkdf2_sha256$600000$JiqnFtDitAjldptTF8Apyp$GpKtUKyWBESAliOaxaMAjpMudss2yPQvaT3Tj83giZA=', NULL, 0, 'Bryan', 'andrianilana', 'thierrybryan', 'andrianilanathierrybryan@gmail.com', 0, 1, '2026-10-05 07:35:18.761721', 'CLIENT', '0349745608', 'Magasin', NULL),
(4, 'pbkdf2_sha256$600000$PV4dkV9OBWLVKSTFbkNStx$PXNDfY/fHKYpQWoRLmAFejr/NxmxRhaXZmWrWBvs62Q=', NULL, 0, 'Rivaldy', 'Rivaldy', 'Rakoto', 'rivaldy@gmail.com', 0, 1, '2026-10-05 07:38:25.488979', 'TECHNICIEN', '0342236697', NULL, 'Maintenance'),
(5, 'pbkdf2_sha256$600000$OgXV27TRPYvOgLKsJkYNp7$bSbUGjl8KGpXwGR7hqh4RoyetoTT9okSqH1x1T/fKHA=', NULL, 0, 'client_test', 'Rina', 'Rakoto', 'rina@example.com', 0, 1, '2026-10-14 12:36:10.355112', 'CLIENT', '0349999999', 'Boutique Rina SARL', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur_groups`
--

CREATE TABLE `utilisateur_groups` (
  `id` bigint(20) NOT NULL,
  `utilisateur_id` bigint(20) NOT NULL,
  `group_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateur_user_permissions`
--

CREATE TABLE `utilisateur_user_permissions` (
  `id` bigint(20) NOT NULL,
  `utilisateur_id` bigint(20) NOT NULL,
  `permission_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `auth_group`
--
ALTER TABLE `auth_group`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Index pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  ADD KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`);

--
-- Index pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`);

--
-- Index pour la table `commentaire`
--
ALTER TABLE `commentaire`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commentaire_auteur_id_cc4b0820_fk_utilisateur_id` (`auteur_id`),
  ADD KEY `commentaire_ticket_id_1bdd826e_fk_ticket_id` (`ticket_id`);

--
-- Index pour la table `commentaire_camtrack`
--
ALTER TABLE `commentaire_camtrack`
  ADD PRIMARY KEY (`id`),
  ADD KEY `commentaire_camtrack_auteur_id_5bad10df_fk_utilisateur_id` (`auteur_id`),
  ADD KEY `commentaire_camtrack_demande_id_65c274a7_fk_demande_i` (`demande_id`);

--
-- Index pour la table `contrat`
--
ALTER TABLE `contrat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `securitrack_contrat_client_id_302b2930_fk_accounts_` (`client_id`);

--
-- Index pour la table `contrat_equipements`
--
ALTER TABLE `contrat_equipements`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `contrat_equipements_contrat_id_equipement_id_3eb275e1_uniq` (`contrat_id`,`equipement_id`),
  ADD KEY `contrat_equipements_equipement_id_a5cfe2e7_fk_equipement_id` (`equipement_id`);

--
-- Index pour la table `demande_installation`
--
ALTER TABLE `demande_installation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `camtrack_demandeinst_client_id_bfb60404_fk_accounts_` (`client_id`),
  ADD KEY `demande_installation_offre_id_2df9c515_fk_offre_id` (`offre_id`);

--
-- Index pour la table `devis`
--
ALTER TABLE `devis`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `demande_id` (`demande_id`);

--
-- Index pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  ADD KEY `django_admin_log_user_id_c564eba6_fk_accounts_utilisateur_id` (`user_id`);

--
-- Index pour la table `django_content_type`
--
ALTER TABLE `django_content_type`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`);

--
-- Index pour la table `django_migrations`
--
ALTER TABLE `django_migrations`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `django_session`
--
ALTER TABLE `django_session`
  ADD PRIMARY KEY (`session_key`),
  ADD KEY `django_session_expire_date_a5c62663` (`expire_date`);

--
-- Index pour la table `equipement`
--
ALTER TABLE `equipement`
  ADD PRIMARY KEY (`id`),
  ADD KEY `camtrack_equipement_installation_id_d370e55e_fk_camtrack_` (`installation_id`);

--
-- Index pour la table `fichier_installation`
--
ALTER TABLE `fichier_installation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fichier_installation_installation_id_4f661fc7_fk_installation_id` (`installation_id`);

--
-- Index pour la table `fichier_site`
--
ALTER TABLE `fichier_site`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fichier_site_site_id_73d794e9_fk_site_id` (`site_id`);

--
-- Index pour la table `historique_ticket`
--
ALTER TABLE `historique_ticket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `historique_ticket_auteur_id_abb1a7f3_fk_utilisateur_id` (`auteur_id`),
  ADD KEY `historique_ticket_ticket_id_c5c8fcc4_fk_ticket_id` (`ticket_id`);

--
-- Index pour la table `installation`
--
ALTER TABLE `installation`
  ADD PRIMARY KEY (`id`),
  ADD KEY `camtrack_installation_site_id_4e67fec5_fk_camtrack_site_id` (`site_id`),
  ADD KEY `camtrack_installatio_technicien_id_96d82e11_fk_accounts_` (`technicien_id`);

--
-- Index pour la table `intervention`
--
ALTER TABLE `intervention`
  ADD PRIMARY KEY (`id`),
  ADD KEY `smart_ticket_interve_ticket_id_5f0151bd_fk_smart_tic` (`ticket_id`),
  ADD KEY `intervention_technicien_id_b679a8ef_fk_utilisateur_id` (`technicien_id`);

--
-- Index pour la table `ligne_devis`
--
ALTER TABLE `ligne_devis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ligne_devis_devis_id_21ff8d4e_fk_devis_id` (`devis_id`);

--
-- Index pour la table `maintenance`
--
ALTER TABLE `maintenance`
  ADD PRIMARY KEY (`id`),
  ADD KEY `securitrack_maintena_equipement_id_7077ad4d_fk_camtrack_` (`equipement_id`),
  ADD KEY `securitrack_maintena_technicien_id_b1a5ff5e_fk_accounts_` (`technicien_id`);

--
-- Index pour la table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notification_utilisateur_id_d8b66182_fk_utilisateur_id` (`utilisateur_id`);

--
-- Index pour la table `offre`
--
ALTER TABLE `offre`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `piece_catalogue`
--
ALTER TABLE `piece_catalogue`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `reference` (`reference`);

--
-- Index pour la table `piece_utilisee`
--
ALTER TABLE `piece_utilisee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `smart_ticket_pieceut_intervention_id_bb64e238_fk_smart_tic` (`intervention_id`),
  ADD KEY `piece_utilisee_piece_id_b689d080_fk_piece_catalogue_id` (`piece_id`);

--
-- Index pour la table `planification`
--
ALTER TABLE `planification`
  ADD PRIMARY KEY (`id`),
  ADD KEY `planification_technicien_id_dc480cfd_fk_utilisateur_id` (`technicien_id`),
  ADD KEY `planification_ticket_id_88e3d53e_fk_ticket_id` (`ticket_id`);

--
-- Index pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `intervention_id` (`intervention_id`);

--
-- Index pour la table `rapport_installation`
--
ALTER TABLE `rapport_installation`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `installation_id` (`installation_id`);

--
-- Index pour la table `site`
--
ALTER TABLE `site`
  ADD PRIMARY KEY (`id`),
  ADD KEY `camtrack_site_demande_id_5770fdbe_fk_camtrack_` (`demande_id`),
  ADD KEY `site_technicien_id_33e416fa_fk_utilisateur_id` (`technicien_id`);

--
-- Index pour la table `ticket`
--
ALTER TABLE `ticket`
  ADD PRIMARY KEY (`id`),
  ADD KEY `smart_ticket_ticket_client_id_e67d79e6_fk_accounts_` (`client_id`),
  ADD KEY `smart_ticket_ticket_technicien_id_322918cb_fk_accounts_` (`technicien_id`);

--
-- Index pour la table `ticket_devis`
--
ALTER TABLE `ticket_devis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_devis_cree_par_id_2616501f_fk_utilisateur_id` (`cree_par_id`),
  ADD KEY `ticket_devis_ticket_id_b916e927_fk_ticket_id` (`ticket_id`);

--
-- Index pour la table `ticket_ligne_devis`
--
ALTER TABLE `ticket_ligne_devis`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_ligne_devis_devis_id_01999e14_fk_ticket_devis_id` (`devis_id`),
  ADD KEY `ticket_ligne_devis_piece_id_1d2830a3_fk_piece_catalogue_id` (`piece_id`);

--
-- Index pour la table `ticket_piece_demandee`
--
ALTER TABLE `ticket_piece_demandee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `ticket_piece_demande_intervention_id_7c27fa7c_fk_intervent` (`intervention_id`),
  ADD KEY `ticket_piece_demandee_piece_id_bce6af79_fk_piece_catalogue_id` (`piece_id`);

--
-- Index pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Index pour la table `utilisateur_groups`
--
ALTER TABLE `utilisateur_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_utilisateur_gro_utilisateur_id_group_id_941da25f_uniq` (`utilisateur_id`,`group_id`),
  ADD KEY `accounts_utilisateur_groups_group_id_a4007cd2_fk_auth_group_id` (`group_id`);

--
-- Index pour la table `utilisateur_user_permissions`
--
ALTER TABLE `utilisateur_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `accounts_utilisateur_use_utilisateur_id_permissio_59447ab2_uniq` (`utilisateur_id`,`permission_id`),
  ADD KEY `accounts_utilisateur_permission_id_6f24b1cb_fk_auth_perm` (`permission_id`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `auth_group`
--
ALTER TABLE `auth_group`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT pour la table `commentaire`
--
ALTER TABLE `commentaire`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `commentaire_camtrack`
--
ALTER TABLE `commentaire_camtrack`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `contrat`
--
ALTER TABLE `contrat`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `contrat_equipements`
--
ALTER TABLE `contrat_equipements`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `demande_installation`
--
ALTER TABLE `demande_installation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `devis`
--
ALTER TABLE `devis`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `django_content_type`
--
ALTER TABLE `django_content_type`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT pour la table `django_migrations`
--
ALTER TABLE `django_migrations`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=47;

--
-- AUTO_INCREMENT pour la table `equipement`
--
ALTER TABLE `equipement`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `fichier_installation`
--
ALTER TABLE `fichier_installation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `fichier_site`
--
ALTER TABLE `fichier_site`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `historique_ticket`
--
ALTER TABLE `historique_ticket`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT pour la table `installation`
--
ALTER TABLE `installation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `intervention`
--
ALTER TABLE `intervention`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `ligne_devis`
--
ALTER TABLE `ligne_devis`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT pour la table `maintenance`
--
ALTER TABLE `maintenance`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `notification`
--
ALTER TABLE `notification`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT pour la table `offre`
--
ALTER TABLE `offre`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `piece_catalogue`
--
ALTER TABLE `piece_catalogue`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `piece_utilisee`
--
ALTER TABLE `piece_utilisee`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `planification`
--
ALTER TABLE `planification`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `rapport`
--
ALTER TABLE `rapport`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `rapport_installation`
--
ALTER TABLE `rapport_installation`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `site`
--
ALTER TABLE `site`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `ticket`
--
ALTER TABLE `ticket`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `ticket_devis`
--
ALTER TABLE `ticket_devis`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `ticket_ligne_devis`
--
ALTER TABLE `ticket_ligne_devis`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `ticket_piece_demandee`
--
ALTER TABLE `ticket_piece_demandee`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `utilisateur`
--
ALTER TABLE `utilisateur`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT pour la table `utilisateur_groups`
--
ALTER TABLE `utilisateur_groups`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `utilisateur_user_permissions`
--
ALTER TABLE `utilisateur_user_permissions`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `auth_group_permissions`
--
ALTER TABLE `auth_group_permissions`
  ADD CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`);

--
-- Contraintes pour la table `auth_permission`
--
ALTER TABLE `auth_permission`
  ADD CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`);

--
-- Contraintes pour la table `commentaire`
--
ALTER TABLE `commentaire`
  ADD CONSTRAINT `commentaire_auteur_id_cc4b0820_fk_utilisateur_id` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `commentaire_ticket_id_1bdd826e_fk_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`);

--
-- Contraintes pour la table `commentaire_camtrack`
--
ALTER TABLE `commentaire_camtrack`
  ADD CONSTRAINT `commentaire_camtrack_auteur_id_5bad10df_fk_utilisateur_id` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `commentaire_camtrack_demande_id_65c274a7_fk_demande_i` FOREIGN KEY (`demande_id`) REFERENCES `demande_installation` (`id`);

--
-- Contraintes pour la table `contrat`
--
ALTER TABLE `contrat`
  ADD CONSTRAINT `securitrack_contrat_client_id_302b2930_fk_accounts_` FOREIGN KEY (`client_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `contrat_equipements`
--
ALTER TABLE `contrat_equipements`
  ADD CONSTRAINT `contrat_equipements_contrat_id_7201803f_fk_contrat_id` FOREIGN KEY (`contrat_id`) REFERENCES `contrat` (`id`),
  ADD CONSTRAINT `contrat_equipements_equipement_id_a5cfe2e7_fk_equipement_id` FOREIGN KEY (`equipement_id`) REFERENCES `equipement` (`id`);

--
-- Contraintes pour la table `demande_installation`
--
ALTER TABLE `demande_installation`
  ADD CONSTRAINT `camtrack_demandeinst_client_id_bfb60404_fk_accounts_` FOREIGN KEY (`client_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `demande_installation_offre_id_2df9c515_fk_offre_id` FOREIGN KEY (`offre_id`) REFERENCES `offre` (`id`);

--
-- Contraintes pour la table `devis`
--
ALTER TABLE `devis`
  ADD CONSTRAINT `camtrack_devis_demande_id_712a65a0_fk_camtrack_` FOREIGN KEY (`demande_id`) REFERENCES `demande_installation` (`id`);

--
-- Contraintes pour la table `django_admin_log`
--
ALTER TABLE `django_admin_log`
  ADD CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  ADD CONSTRAINT `django_admin_log_user_id_c564eba6_fk_accounts_utilisateur_id` FOREIGN KEY (`user_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `equipement`
--
ALTER TABLE `equipement`
  ADD CONSTRAINT `camtrack_equipement_installation_id_d370e55e_fk_camtrack_` FOREIGN KEY (`installation_id`) REFERENCES `installation` (`id`);

--
-- Contraintes pour la table `fichier_installation`
--
ALTER TABLE `fichier_installation`
  ADD CONSTRAINT `fichier_installation_installation_id_4f661fc7_fk_installation_id` FOREIGN KEY (`installation_id`) REFERENCES `installation` (`id`);

--
-- Contraintes pour la table `fichier_site`
--
ALTER TABLE `fichier_site`
  ADD CONSTRAINT `fichier_site_site_id_73d794e9_fk_site_id` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`);

--
-- Contraintes pour la table `historique_ticket`
--
ALTER TABLE `historique_ticket`
  ADD CONSTRAINT `historique_ticket_auteur_id_abb1a7f3_fk_utilisateur_id` FOREIGN KEY (`auteur_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `historique_ticket_ticket_id_c5c8fcc4_fk_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`);

--
-- Contraintes pour la table `installation`
--
ALTER TABLE `installation`
  ADD CONSTRAINT `camtrack_installatio_technicien_id_96d82e11_fk_accounts_` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `camtrack_installation_site_id_4e67fec5_fk_camtrack_site_id` FOREIGN KEY (`site_id`) REFERENCES `site` (`id`);

--
-- Contraintes pour la table `intervention`
--
ALTER TABLE `intervention`
  ADD CONSTRAINT `intervention_technicien_id_b679a8ef_fk_utilisateur_id` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `smart_ticket_interve_ticket_id_5f0151bd_fk_smart_tic` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`);

--
-- Contraintes pour la table `ligne_devis`
--
ALTER TABLE `ligne_devis`
  ADD CONSTRAINT `ligne_devis_devis_id_21ff8d4e_fk_devis_id` FOREIGN KEY (`devis_id`) REFERENCES `devis` (`id`);

--
-- Contraintes pour la table `maintenance`
--
ALTER TABLE `maintenance`
  ADD CONSTRAINT `securitrack_maintena_equipement_id_7077ad4d_fk_camtrack_` FOREIGN KEY (`equipement_id`) REFERENCES `equipement` (`id`),
  ADD CONSTRAINT `securitrack_maintena_technicien_id_b1a5ff5e_fk_accounts_` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `notification_utilisateur_id_d8b66182_fk_utilisateur_id` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `piece_utilisee`
--
ALTER TABLE `piece_utilisee`
  ADD CONSTRAINT `piece_utilisee_piece_id_b689d080_fk_piece_catalogue_id` FOREIGN KEY (`piece_id`) REFERENCES `piece_catalogue` (`id`),
  ADD CONSTRAINT `smart_ticket_pieceut_intervention_id_bb64e238_fk_smart_tic` FOREIGN KEY (`intervention_id`) REFERENCES `intervention` (`id`);

--
-- Contraintes pour la table `planification`
--
ALTER TABLE `planification`
  ADD CONSTRAINT `planification_technicien_id_dc480cfd_fk_utilisateur_id` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `planification_ticket_id_88e3d53e_fk_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`);

--
-- Contraintes pour la table `rapport`
--
ALTER TABLE `rapport`
  ADD CONSTRAINT `rapport_intervention_id_5f931180_fk_intervention_id` FOREIGN KEY (`intervention_id`) REFERENCES `intervention` (`id`);

--
-- Contraintes pour la table `rapport_installation`
--
ALTER TABLE `rapport_installation`
  ADD CONSTRAINT `rapport_installation_installation_id_281cade7_fk_installation_id` FOREIGN KEY (`installation_id`) REFERENCES `installation` (`id`);

--
-- Contraintes pour la table `site`
--
ALTER TABLE `site`
  ADD CONSTRAINT `camtrack_site_demande_id_5770fdbe_fk_camtrack_` FOREIGN KEY (`demande_id`) REFERENCES `demande_installation` (`id`),
  ADD CONSTRAINT `site_technicien_id_33e416fa_fk_utilisateur_id` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `ticket`
--
ALTER TABLE `ticket`
  ADD CONSTRAINT `smart_ticket_ticket_client_id_e67d79e6_fk_accounts_` FOREIGN KEY (`client_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `smart_ticket_ticket_technicien_id_322918cb_fk_accounts_` FOREIGN KEY (`technicien_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `ticket_devis`
--
ALTER TABLE `ticket_devis`
  ADD CONSTRAINT `ticket_devis_cree_par_id_2616501f_fk_utilisateur_id` FOREIGN KEY (`cree_par_id`) REFERENCES `utilisateur` (`id`),
  ADD CONSTRAINT `ticket_devis_ticket_id_b916e927_fk_ticket_id` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`);

--
-- Contraintes pour la table `ticket_ligne_devis`
--
ALTER TABLE `ticket_ligne_devis`
  ADD CONSTRAINT `ticket_ligne_devis_devis_id_01999e14_fk_ticket_devis_id` FOREIGN KEY (`devis_id`) REFERENCES `ticket_devis` (`id`),
  ADD CONSTRAINT `ticket_ligne_devis_piece_id_1d2830a3_fk_piece_catalogue_id` FOREIGN KEY (`piece_id`) REFERENCES `piece_catalogue` (`id`);

--
-- Contraintes pour la table `ticket_piece_demandee`
--
ALTER TABLE `ticket_piece_demandee`
  ADD CONSTRAINT `ticket_piece_demande_intervention_id_7c27fa7c_fk_intervent` FOREIGN KEY (`intervention_id`) REFERENCES `intervention` (`id`),
  ADD CONSTRAINT `ticket_piece_demandee_piece_id_bce6af79_fk_piece_catalogue_id` FOREIGN KEY (`piece_id`) REFERENCES `piece_catalogue` (`id`);

--
-- Contraintes pour la table `utilisateur_groups`
--
ALTER TABLE `utilisateur_groups`
  ADD CONSTRAINT `accounts_utilisateur_groups_group_id_a4007cd2_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  ADD CONSTRAINT `accounts_utilisateur_utilisateur_id_ca92c3d8_fk_accounts_` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`);

--
-- Contraintes pour la table `utilisateur_user_permissions`
--
ALTER TABLE `utilisateur_user_permissions`
  ADD CONSTRAINT `accounts_utilisateur_permission_id_6f24b1cb_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  ADD CONSTRAINT `accounts_utilisateur_utilisateur_id_1f62d6d5_fk_accounts_` FOREIGN KEY (`utilisateur_id`) REFERENCES `utilisateur` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
