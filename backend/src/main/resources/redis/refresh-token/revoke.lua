if redis.call('GET', KEYS[3]) == ARGV[1] then
  redis.call('DEL', KEYS[3])
end
local removed = redis.call('DEL', KEYS[1])
redis.call('SREM', KEYS[2], ARGV[1])
if redis.call('SCARD', KEYS[2]) == 0 then
  redis.call('DEL', KEYS[2])
end
return removed
