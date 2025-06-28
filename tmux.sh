DIR=${pwd}
SESSIONNAME=AH-p2p
MNEMONIC=$(grep MNEMONIC ./hardhat/.env | cut -d '=' -f 2-)
tmux new-session -s $SESSIONNAME \; \
	split-window -v \; \
	send-keys "cd web && npm run dev" C-m \; \
	split-window -h \; \
	send-keys "cd hardhat && anvil --mnemonic '${MNEMONIC}' --block-time 5" C-m \; \
	split-window -h \; \
  send-keys "sleep 4 && cd hardhat && npx hardhat deploy ./deploy/deploy.ts --network localhost --reset" C-m \; \