import axios from 'axios'

export function InvalidAxiosScreen() {
  return <button type="button" onClick={() => axios.get('/invalid')}>invalid</button>
}
