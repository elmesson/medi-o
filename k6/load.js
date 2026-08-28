import http from 'k6/http';
import { sleep, check } from 'k6';
export const options = { vus: 20, duration: '30s', thresholds: { http_req_failed: ['rate<0.01'], http_req_duration: ['p(95)<500'] } };
export default function () {
  const res = http.get('http://localhost:3000/api/dashboard', { headers: { Authorization: 'Bearer fake-test' } });
  check(res, { '200 ou 401': (r) => [200,401].includes(r.status) });
  sleep(1);
}
