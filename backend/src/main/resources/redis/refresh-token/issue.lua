local previousSessionId = redis.call('GET', KEYS[3])
if previousSessionId and previousSessionId ~= ARGV[1] then
  redis.call('DEL', ARGV[13] .. previousSessionId)
  redis.call('SREM', KEYS[2], previousSessionId)
end

redis.call('HSET', KEYS[1],
  'sessionId', ARGV[1],
  'userId', ARGV[2],
  'deviceId', ARGV[3],
  'displayName', ARGV[4],
  'platform', ARGV[5],
  'userAgent', ARGV[6],
  'lastIp', ARGV[7],
  'currentJti', ARGV[8],
  'createdAt', ARGV[9],
  'lastSeenAt', ARGV[10],
  'expiresAt', ARGV[11])
redis.call('PEXPIRE', KEYS[1], ARGV[12])

redis.call('SADD', KEYS[2], ARGV[1])
redis.call('PEXPIRE', KEYS[2], ARGV[12])
redis.call('SET', KEYS[3], ARGV[1], 'PX', ARGV[12])
return 1
