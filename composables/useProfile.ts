export const useProfile = () => {
  const db = useDatabase()

  const saveProfile = async (profile:any) => {
    localStorage.setItem('profile_setup_complete','true')
    return db.insert('profiles', profile)
  }

  const getProfile = async () => {
    const profiles = await db.getAll('profiles')
    return profiles[0]
  }

  return { saveProfile, getProfile }
}