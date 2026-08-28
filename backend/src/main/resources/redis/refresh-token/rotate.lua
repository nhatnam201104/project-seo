if redis.call('EXISTS', KEYS[1]) == 0 then
  redis.call('SREM', KEYS[2], ARGV[1])
  if redis.call('SCARD', KEYS[2]) == 0 then
    redis.call('DEL', KEYS[2])
  end
  return 0
end

local currentJti = redis.call('HGET', KEYS[1], 'currentJti')
if currentJti ~= ARGV[2] then
  if redis.call('GET', KEYS[3]) == ARGV[1] then
    redis.call('DEL', KEYS[3])
  end
  redis.call('DEL', KEYS[1])
  redis.call('SREM', KEYS[2], ARGV[1])
  if redis.call('SCARD', KEYS[2]) == 0 then
    redis.call('DEL', KEYS[2])
  end
  return -1
end

redis.call('HSET', KEYS[1],
  'currentJti', ARGV[3],
  'lastSeenAt', ARGV[6],
  'expiresAt', ARGV[7])
if ARGV[4] ~= '' then
  redis.call('HSET', KEYS[1], 'userAgent', ARGV[4])
end
if ARGV[5] ~= '' then
  redis.call('HSET', KEYS[1], 'lastIp', ARGV[5])
end
redis.call('PEXPIRE', KEYS[1], ARGV[8])
redis.call('SADD', KEYS[2], ARGV[1])
redis.call('PEXPIRE', KEYS[2], ARGV[8])
redis.call('SET', KEYS[3], ARGV[1], 'PX', ARGV[8])
return 1
