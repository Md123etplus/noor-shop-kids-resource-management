export interface Customer {
  id: string
  client_id: string | null
  nom: string | null
  prenom: string | null
  telephone: string | null
  email: string | null
  adresse: string | null
  produit_achete: string | null
  date_achat: string | null
  statut_client: string | null
  commentaire: string | null
  created_at: string
  updated_at: string
  user_id: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  created_at: string
}
